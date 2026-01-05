# JVM과 Garbage Collection 이해하기

> JVM 아키텍처부터 GC 알고리즘까지 심층 분석

---

## 1. JVM 아키텍처 개요

JVM(Java Virtual Machine)은 Java 바이트코드를 실행하는 가상 머신이다. "Write Once, Run Anywhere"를 가능하게 하는 핵심 컴포넌트.

### 1.1 JVM 전체 구조

```
┌──────────────────────────────────────────────────────────────────┐
│                         JVM Architecture                          │
├──────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Class Loader Subsystem                   │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌────────────────────┐  │  │
│  │  │   Loading    │→│   Linking    │→│   Initialization   │  │  │
│  │  │ (Bootstrap,  │ │ (Verify,     │ │ (static 초기화)    │  │  │
│  │  │  Extension,  │ │  Prepare,    │ │                    │  │  │
│  │  │  Application)│ │  Resolve)    │ │                    │  │  │
│  │  └──────────────┘ └──────────────┘ └────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    Runtime Data Areas                       │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ ┌───────┐  │  │
│  │  │ Method  │ │  Heap   │ │  Stack  │ │   PC   │ │Native │  │  │
│  │  │  Area   │ │         │ │ (per    │ │Register│ │Method │  │  │
│  │  │(Metasp.)│ │         │ │ thread) │ │        │ │ Stack │  │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └────────┘ └───────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                     Execution Engine                        │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌───────────────────────┐ │  │
│  │  │ Interpreter │ │ JIT Compiler│ │   Garbage Collector   │ │  │
│  │  └─────────────┘ └─────────────┘ └───────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              ↓                                    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Native Method Interface (JNI)                  │  │
│  │                Native Method Libraries                       │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

> 출처: [JVM Architecture - Oracle](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html)

---

### 1.2 Class Loader Subsystem

Java 클래스(.class 파일)를 메모리에 로드하고 링크하는 역할.

#### Loading (로딩)

3단계 위임 모델 (Parent Delegation Model):

```
                    ┌─────────────────────┐
                    │  Bootstrap Loader   │  ← rt.jar, 핵심 Java 클래스
                    │  (Native Code)      │     java.lang.*, java.util.*
                    └─────────┬───────────┘
                              ↑ 위임
                    ┌─────────┴───────────┐
                    │  Extension Loader   │  ← jre/lib/ext/*.jar
                    │  (Platform Loader)  │     javax.*, security 관련
                    └─────────┬───────────┘
                              ↑ 위임
                    ┌─────────┴───────────┐
                    │  Application Loader │  ← classpath의 클래스들
                    │  (System Loader)    │     개발자가 작성한 코드
                    └─────────────────────┘
```

**동작 방식**:
1. 클래스 로드 요청이 들어오면 **부모에게 먼저 위임**
2. 부모가 찾지 못하면 자신이 로드 시도
3. 어디서도 못 찾으면 `ClassNotFoundException`

```java
// 클래스 로더 확인
System.out.println(String.class.getClassLoader());      // null (Bootstrap)
System.out.println(MyClass.class.getClassLoader());     // AppClassLoader
```

**왜 이렇게 하나?**
- **보안**: 악의적인 java.lang.String 클래스 로드 방지
- **일관성**: 핵심 클래스는 항상 같은 버전 사용

> 출처: [Understanding Class Loaders - Baeldung](https://www.baeldung.com/java-classloaders)

#### Linking (링킹)

```
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    Verify     │ →   │    Prepare    │ →   │    Resolve    │
│ 바이트코드 검증│     │ static 메모리 │     │ 심볼릭 참조를 │
│ (보안 체크)   │     │ 할당 + 기본값 │     │ 실제 참조로   │
└───────────────┘     └───────────────┘     └───────────────┘
```

1. **Verify**: 바이트코드가 JVM 명세에 맞는지 검증
2. **Prepare**: static 변수 메모리 할당, 기본값 초기화 (0, null 등)
3. **Resolve**: 심볼릭 참조 → 실제 메모리 주소 (lazy하게 수행될 수 있음)

#### Initialization (초기화)

static 변수에 실제 값 할당, static 블록 실행

```java
class Example {
    static int x = 10;           // Prepare: x=0, Initialize: x=10
    static List<String> list;

    static {
        list = new ArrayList<>();  // Initialize 단계에서 실행
        list.add("init");
    }
}
```

> 출처: [JVM Internals - Inside Java](https://blogs.oracle.com/javamagazine/post/java-class-file-jvm)

---

### 1.3 Runtime Data Areas

JVM이 프로그램 실행 중 사용하는 메모리 영역들.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Runtime Data Areas                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 모든 스레드가 공유                        │    │
│  │  ┌───────────────────┐  ┌─────────────────────────────┐ │    │
│  │  │    Method Area    │  │           Heap              │ │    │
│  │  │    (Metaspace)    │  │  ┌───────────┬───────────┐  │ │    │
│  │  │                   │  │  │ Young Gen │  Old Gen  │  │ │    │
│  │  │ • 클래스 메타데이터│  │  │┌────┬───┐│           │  │ │    │
│  │  │ • 상수 풀         │  │  ││Eden│S0 ││           │  │ │    │
│  │  │ • 메서드 코드     │  │  ││    │S1 ││           │  │ │    │
│  │  │ • static 변수     │  │  │└────┴───┘│           │  │ │    │
│  │  └───────────────────┘  │  └───────────┴───────────┘  │ │    │
│  │                          └─────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                 스레드마다 별도 생성                      │    │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │    │
│  │  │ PC Reg.  │  │  Stack   │  │  Native Method Stack   │ │    │
│  │  │ (Thread1)│  │ (Thread1)│  │      (Thread1)         │ │    │
│  │  └──────────┘  └──────────┘  └────────────────────────┘ │    │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │    │
│  │  │ PC Reg.  │  │  Stack   │  │  Native Method Stack   │ │    │
│  │  │ (Thread2)│  │ (Thread2)│  │      (Thread2)         │ │    │
│  │  └──────────┘  └──────────┘  └────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

#### Method Area (Metaspace)

**Java 8 이전**: PermGen (Permanent Generation)
**Java 8 이후**: Metaspace (Native Memory 사용)

저장 내용:
- 클래스 구조 (필드, 메서드 정보)
- Runtime Constant Pool
- 메서드 바이트코드
- static 변수

```bash
# Metaspace 크기 설정 (Java 8+)
-XX:MetaspaceSize=128m        # 초기 크기
-XX:MaxMetaspaceSize=256m     # 최대 크기 (기본: 무제한)
```

**PermGen → Metaspace 변경 이유**:
- PermGen은 힙의 일부 → 크기 제한으로 `OutOfMemoryError: PermGen space` 자주 발생
- Metaspace는 Native Memory 사용 → 자동으로 확장 가능

```
Java 7:                          Java 8+:
┌─────────────────────┐          ┌─────────────────────┐
│        Heap         │          │        Heap         │
│  ┌───────────────┐  │          │  ┌───────────────┐  │
│  │   Young Gen   │  │          │  │   Young Gen   │  │
│  ├───────────────┤  │          │  ├───────────────┤  │
│  │    Old Gen    │  │          │  │    Old Gen    │  │
│  ├───────────────┤  │          │  └───────────────┘  │
│  │    PermGen    │  │          └─────────────────────┘
│  └───────────────┘  │
└─────────────────────┘          ┌─────────────────────┐
                                 │   Native Memory     │
                                 │  ┌───────────────┐  │
                                 │  │   Metaspace   │  │
                                 │  └───────────────┘  │
                                 └─────────────────────┘
```

> 출처: [Metaspace in Java 8 - Oracle](https://blogs.oracle.com/poonam/post/about-g1-garbage-collector-permanent-generation-and-metaspace)

#### Heap

모든 객체와 배열이 할당되는 영역. **GC의 주요 대상**.

```java
User user = new User();  // User 객체는 Heap에 생성
int[] arr = new int[10]; // 배열도 Heap에 생성
```

자세한 내용은 아래 Heap 구조 섹션 참조.

#### JVM Stack (per Thread)

각 스레드마다 별도로 생성. **Stack Frame**들의 집합.

```
┌─────────────────────────────────────────┐
│              JVM Stack (Thread1)         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐ │
│  │ Frame: method3()                     │ │  ← top (현재 실행 중)
│  │  ├─ Local Variables [this, x, y]    │ │
│  │  ├─ Operand Stack [...]             │ │
│  │  └─ Frame Data (return addr, etc.)  │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ Frame: method2()                     │ │
│  │  ├─ Local Variables [this, param1]  │ │
│  │  ├─ Operand Stack [...]             │ │
│  │  └─ Frame Data                       │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ Frame: method1()                     │ │
│  │  ├─ Local Variables [this, args]    │ │
│  │  ├─ Operand Stack [...]             │ │
│  │  └─ Frame Data                       │ │
│  └─────────────────────────────────────┘ │
│  ┌─────────────────────────────────────┐ │
│  │ Frame: main()                        │ │  ← bottom
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Stack Frame 구성요소**:

1. **Local Variables Array**: 지역 변수, 메서드 파라미터
2. **Operand Stack**: 연산에 필요한 값들
3. **Frame Data**: 리턴 주소, 예외 테이블 참조 등

```java
public int calculate(int a, int b) {
    int sum = a + b;    // Local Variables: [this, a, b, sum]
    return sum * 2;
}

// 바이트코드 (Operand Stack 사용)
// iload_1        // a를 Operand Stack에 push
// iload_2        // b를 Operand Stack에 push
// iadd           // pop 2개, 더해서 push
// istore_3       // pop해서 sum(index 3)에 저장
```

**스택 크기 설정**:
```bash
-Xss512k   # 스레드당 스택 크기 (기본: 1MB)
```

**StackOverflowError**:
```java
void infinite() {
    infinite();  // 무한 재귀 → Stack Frame 계속 쌓임 → overflow
}
```

> 출처: [JVM Stack and Heap - Oracle Java SE Specs](https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html#jvms-2.5)

#### PC Register (Program Counter)

현재 실행 중인 명령어의 주소를 저장. 스레드마다 별도.

```
Thread 1: PC = 0x00A3 (method1의 10번째 바이트코드)
Thread 2: PC = 0x00F7 (method2의 3번째 바이트코드)
```

Native 메서드 실행 중이면 PC는 undefined.

#### Native Method Stack

JNI(Java Native Interface)를 통해 호출되는 네이티브 메서드(C/C++)용 스택.

```java
public class Example {
    // 네이티브 메서드 선언
    public native void nativeMethod();

    static {
        System.loadLibrary("mylib");  // libmylib.so 로드
    }
}
```

---

### 1.4 Execution Engine

바이트코드를 실제 기계어로 변환하여 실행.

#### Interpreter

바이트코드를 한 줄씩 읽어서 실행. **시작은 빠르지만 반복 실행 시 느림**.

```
바이트코드: iload_1, iload_2, iadd, ireturn
           ↓       ↓       ↓       ↓
인터프리터: 해석     해석     해석     해석  (매번 반복)
```

#### JIT Compiler (Just-In-Time)

자주 실행되는 코드(Hot Spot)를 **네이티브 코드로 컴파일**하여 캐싱.

```
┌────────────────────────────────────────────────────────────┐
│                    JIT Compilation Flow                     │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  [바이트코드] → [프로파일링] → [Hot Spot 감지] → [컴파일]    │
│       ↓              ↓              ↓              ↓        │
│   인터프리터     실행 횟수 측정    임계값 초과     네이티브   │
│   로 실행       (메서드/루프)    (기본: 10000)    코드 생성  │
│                                                              │
│  다음 호출 시:                                               │
│  [메서드 호출] → [코드 캐시 확인] → [네이티브 코드 직접 실행] │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

**JIT 컴파일러 종류 (Tiered Compilation)**:

```
┌─────────────────────────────────────────────────────────────┐
│                   Tiered Compilation                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Level 0: Interpreter (시작점)                               │
│       ↓                                                       │
│  Level 1-3: C1 Compiler (Client Compiler)                    │
│       │    - 빠른 컴파일                                      │
│       │    - 간단한 최적화                                    │
│       ↓                                                       │
│  Level 4: C2 Compiler (Server Compiler)                      │
│            - 느린 컴파일                                      │
│            - 공격적인 최적화 (인라이닝, 루프 언롤링 등)       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**JIT 최적화 기법들**:

1. **Inlining**: 메서드 호출을 본문으로 대체
```java
// 최적화 전
int result = getValue();

// 최적화 후 (getValue가 간단하면)
int result = this.value;
```

2. **Loop Unrolling**: 루프 반복 줄이기
```java
// 최적화 전
for (int i = 0; i < 4; i++) { arr[i] = 0; }

// 최적화 후
arr[0] = 0; arr[1] = 0; arr[2] = 0; arr[3] = 0;
```

3. **Escape Analysis**: 객체가 메서드 밖으로 탈출하지 않으면 스택에 할당
```java
void process() {
    Point p = new Point(1, 2);  // 힙 대신 스택에 할당 가능
    int sum = p.x + p.y;
    // p는 이 메서드 밖으로 나가지 않음
}
```

4. **Dead Code Elimination**: 사용되지 않는 코드 제거

```bash
# JIT 관련 옵션
-XX:+PrintCompilation              # 컴파일되는 메서드 출력
-XX:CompileThreshold=10000         # 컴파일 임계값
-XX:-TieredCompilation             # Tiered Compilation 비활성화
```

> 출처: [JIT Compiler - Oracle](https://docs.oracle.com/en/java/javase/17/vm/java-hotspot-virtual-machine-performance-enhancements.html)

---

### 1.5 Object 메모리 레이아웃

Java 객체가 Heap에서 어떻게 저장되는지.

```
┌───────────────────────────────────────────────────────────────┐
│                    Object Memory Layout                        │
├───────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Object Header                         │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Mark Word (8 bytes on 64-bit)                      │  │   │
│  │  │  • HashCode (identity hash)                        │  │   │
│  │  │  • GC age (4 bits)                                 │  │   │
│  │  │  • Lock state (biased/lightweight/heavyweight)     │  │   │
│  │  │  • GC marking bits                                 │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Class Pointer (4 or 8 bytes)                       │  │   │
│  │  │  • Metaspace의 클래스 메타데이터 참조              │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Array Length (4 bytes, 배열인 경우만)              │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Instance Data                          │   │
│  │  • 필드 값들 (primitive는 값, reference는 주소)         │   │
│  │  • 상위 클래스 필드 포함                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                     Padding                              │   │
│  │  • 8바이트 정렬을 위한 패딩                              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└───────────────────────────────────────────────────────────────┘
```

**예시**: 간단한 객체의 실제 크기

```java
class Example {
    int x;      // 4 bytes
    long y;     // 8 bytes
    byte z;     // 1 byte
}

// 실제 메모리 레이아웃 (64-bit, Compressed OOPs 사용 시)
// Mark Word:       8 bytes
// Class Pointer:   4 bytes (compressed)
// int x:           4 bytes
// long y:          8 bytes
// byte z:          1 byte
// Padding:         7 bytes (8바이트 정렬)
// ─────────────────────────
// Total:          32 bytes
```

**Compressed OOPs (Ordinary Object Pointers)**:
- 힙 크기가 32GB 미만이면 자동 활성화
- 64bit 포인터를 32bit로 압축
- 메모리 절약 + 캐시 효율 향상

```bash
-XX:+UseCompressedOops     # 기본 활성화 (힙 < 32GB)
-XX:-UseCompressedOops     # 비활성화
```

> 출처: [HotSpot Glossary - OpenJDK](https://openjdk.org/groups/hotspot/docs/HotSpotGlossary.html)

---

### 1.6 String Pool과 Interning

String은 특별 취급. **String Pool**에서 중복 제거.

```
┌─────────────────────────────────────────────────────────────┐
│                         Heap                                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    String Pool                         │  │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐       │  │
│  │  │ "hello"│  │ "world"│  │ "java" │  │  ...   │       │  │
│  │  └────────┘  └────────┘  └────────┘  └────────┘       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   일반 Heap 영역                       │  │
│  │  new String("hello") → 별도 객체 생성                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

```java
String s1 = "hello";              // String Pool에서 가져옴
String s2 = "hello";              // 같은 객체 참조
String s3 = new String("hello");  // 새 객체 생성 (Pool 아님)
String s4 = s3.intern();          // Pool에 있는 객체 반환

System.out.println(s1 == s2);     // true (같은 참조)
System.out.println(s1 == s3);     // false (다른 객체)
System.out.println(s1 == s4);     // true (intern으로 Pool 참조)
```

**Java 7+**: String Pool이 PermGen에서 Heap으로 이동 → GC 대상이 됨

> 출처: [String Constant Pool - Baeldung](https://www.baeldung.com/java-string-pool)

---

## 2. Garbage Collection이란?

프로그래머가 직접 메모리를 해제하지 않아도 **JVM이 알아서 사용하지 않는 객체를 정리**해주는 것.

```java
// C언어 - 직접 해제해야 함
int* ptr = malloc(sizeof(int));
free(ptr);  // 안 하면 메모리 누수

// Java - GC가 알아서 처리
User user = new User();
user = null;  // 더 이상 참조 없음 → GC 대상
```

편하지만 **공짜는 아니다**. GC가 동작할 때 성능 비용이 발생한다.

> 출처: [Java Garbage Collection Basics - Oracle](https://www.oracle.com/technetwork/tutorials/tutorials-1873457.html)

---

## 3. Heap 메모리 구조 (Generational Heap Model)

```
┌─────────────────────────────────────────────────┐
│                    Heap                          │
│  ┌─────────────────┬───────────────────────────┐ │
│  │   Young Gen     │        Old Gen            │ │
│  │  ┌─────┬──────┐ │                           │ │
│  │  │Eden │ S0/S1│ │                           │ │
│  │  └─────┴──────┘ │                           │ │
│  └─────────────────┴───────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Young Generation

새로 생성된 객체가 할당되는 영역. 세 부분으로 나뉜다:

- **Eden**: 객체가 최초로 생성되는 곳. Eden이 가득 차면 Minor GC 발생.
- **Survivor 0, 1 (S0, S1)**: Minor GC에서 살아남은 객체가 이동. 두 영역을 번갈아 사용.

### Old Generation (Tenured)

Young Gen에서 오래 살아남은 객체가 이동하는 곳. 객체의 age가 임계값(기본 15)을 넘으면 **Promotion** 된다.

```bash
# Tenuring Threshold 설정
-XX:MaxTenuringThreshold=15
```

### 왜 세대를 나눠놨을까?

**Weak Generational Hypothesis**: 대부분의 객체는 금방 죽는다.

```java
void process() {
    List<String> temp = new ArrayList<>();  // 생성
    // ... 작업
}  // 메서드 끝나면 필요 없음
```

금방 죽는 객체를 위해 전체 힙을 스캔하는 건 비효율적. **Young Gen만 자주 청소**하고, Old Gen은 가끔 청소한다.

> 출처: [Generations - Oracle Java SE 8 GC Tuning Guide](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/generations.html)

---

## 4. Minor GC: Eden에서 Old Gen까지의 여정

객체가 생성되고 GC를 거쳐 Old Generation으로 이동하는 전체 과정을 단계별로 살펴본다.

### 4.1 객체 할당: TLAB (Thread-Local Allocation Buffer)

새 객체는 Eden 영역에 할당된다. 하지만 멀티스레드 환경에서 여러 스레드가 동시에 Eden에 할당하면 동기화 비용이 발생한다. 이를 해결하기 위해 **TLAB**을 사용한다.

```
┌─────────────────── Eden 영역 ───────────────────┐
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Thread1 │  │ Thread2 │  │ Thread3 │  [Free] │
│  │  TLAB   │  │  TLAB   │  │  TLAB   │         │
│  └─────────┘  └─────────┘  └─────────┘         │
└────────────────────────────────────────────────┘
```

- 각 스레드는 Eden 내에 자신만의 버퍼(TLAB)를 가진다
- 객체 할당 시 자기 TLAB 내에서 **bump-the-pointer**로 빠르게 할당
- TLAB이 가득 차면 새 TLAB을 할당받음
- **락 없이 빠른 할당 가능**

```java
// 내부적으로 이런 식으로 동작
Object obj = new Object();
// → 현재 스레드의 TLAB에서 포인터만 이동시켜 할당
// → TLAB top += sizeof(Object)
```

**Bump-the-Pointer**:
```
할당 전: [Object1][Object2][    Free Space    ]
                           ↑ top 포인터

할당 후: [Object1][Object2][Object3][  Free   ]
                                    ↑ top 포인터 이동
```

> 출처: [Thread-Local Allocation Buffers (TLAB) - Oracle Blogs](https://blogs.oracle.com/javamagazine/post/understanding-the-jdks-new-superfast-garbage-collectors)

---

### 4.2 첫 번째 Minor GC: Eden이 가득 찼을 때

Eden 영역이 가득 차면 **Minor GC**가 발생한다.

```
[시작 상태 - Eden 가득 참]

Eden:     [A][B][C][D][E][F][G][H] ← 가득 참
Survivor0: [            ] (비어있음, To 역할)
Survivor1: [            ] (비어있음)
Old Gen:   [            ]

참조 관계:
Root → A → B
       ↓
       C
D, E, F, G, H는 아무도 참조 안 함 (가비지)
```

**Step 1: Stop-The-World**

```
애플리케이션 스레드: [실행 중...]───┤ 일시정지 ├───[재개]
GC 스레드:                         │ GC 수행  │
```

모든 애플리케이션 스레드가 **Safepoint**에서 멈춘다.

**Safepoint란?**
- GC가 안전하게 수행될 수 있는 지점
- 모든 객체 참조가 일관된 상태
- 예: 메서드 호출 사이, 루프 백엣지(loop back-edge)

```java
for (int i = 0; i < 1000000; i++) {
    // 루프 반복 시 safepoint 체크
    doSomething();  // 메서드 호출 후 safepoint
}
```

> 출처: [Safepoints: Meaning, Side Effects and Overheads - Oracle HotSpot](https://psy-lob-saw.blogspot.com/2015/12/safepoints.html)

**Step 2: GC Roots에서 시작하여 Mark**

GC Root는 다음을 포함한다:
- 스레드 스택의 지역 변수
- static 변수
- JNI 참조
- 동기화 모니터

```
GC Roots:
  ├── main 스레드 스택
  │     └── 지역변수 ref → [A]
  ├── static UserService.instance → [X] (Old Gen에 있음)
  └── synchronized 모니터 → [Y]

Mark 과정:
  [A] ← Root가 참조 → Mark!
   ↓
  [B] ← A가 참조 → Mark!

  [A]
   ↓
  [C] ← A가 참조 → Mark!

결과:
  A, B, C → 살아있음 (Marked)
  D, E, F, G, H → 죽음 (Unmarked) → 가비지
```

**Step 3: 살아남은 객체를 Survivor로 복사**

```
복사 전:
Eden:      [A✓][B✓][C✓][D][E][F][G][H]
Survivor0: [                        ] (To)
Survivor1: [                        ] (From)

복사 후:
Eden:      [   가비지 - 전체 해제    ]
Survivor0: [A(age=1)][B(age=1)][C(age=1)]
Survivor1: [                        ]

객체 헤더에 age 기록:
┌──────────────────────────────────┐
│ Object Header (Mark Word)        │
├──────────────────────────────────┤
│ ... | age(4bit) | ...            │
│     |    1      |                │
└──────────────────────────────────┘
```

**핵심**: Eden은 통째로 비워진다. 살아남은 객체만 Survivor로 **복사**된다.

> 출처: [How Java Garbage Collection Really Works - InfoQ](https://www.infoq.com/articles/Java-Garbage-Collection/)

---

### 4.3 두 번째 Minor GC: Survivor 간 이동

다시 Eden이 가득 차면 두 번째 Minor GC 발생.

```
[시작 상태]
Eden:      [I][J][K][L][M] ← 새로 할당된 객체들
Survivor0: [A(1)][B(1)][C(1)] (From) ← 이전 GC 생존자
Survivor1: [              ] (To)

참조 관계:
Root → A → B (계속 참조 중)
C, I, J, K, L, M은 더 이상 참조 안 함
```

**Mark 결과**:
```
Marked (살아있음): A, B
Unmarked (가비지): C, I, J, K, L, M
```

**복사**:
```
복사 후:
Eden:      [    전체 해제    ]
Survivor0: [    전체 해제    ] (다음 GC의 To가 됨)
Survivor1: [A(age=2)][B(age=2)] (이번 GC의 To)
              ↑
           age 증가!
```

**Survivor 영역의 규칙**:
1. **항상 하나는 비어있다** - From과 To가 번갈아가며 역할 교체
2. **Eden + From → To로 복사** - 살아남은 객체만
3. **복사 후 Eden과 From은 통째로 해제**
4. **From/To 역할 교체** - 다음 GC에서 To가 From이 됨

```
GC 1: Eden → S0(To), S1(From=empty)
GC 2: Eden + S0(From) → S1(To)
GC 3: Eden + S1(From) → S0(To)
GC 4: Eden + S0(From) → S1(To)
... 반복
```

> 출처: [How Does Garbage Collection Work in Java? - Baeldung](https://www.baeldung.com/java-garbage-collection-basics)

---

### 4.4 Promotion: Old Generation으로 이동

객체의 age가 임계값(기본 15)에 도달하면 Old Gen으로 **승격(Promotion)** 된다.

```
[15번째 Minor GC]
Survivor0: [A(age=15)][B(age=15)] (From)
Survivor1: [                   ] (To)

Promotion 발생:
Old Gen:   [A][B] ← age=15 이상이라 Old Gen으로 이동
Survivor1: [    ] ← A, B는 여기로 안 감

A, B는 이제 Minor GC 대상이 아님 (Major GC에서만 수집)
```

**Premature Promotion 문제**:

Survivor 영역이 너무 작으면 age 임계값에 도달하지 않아도 강제 승격된다.

```
Survivor가 작은 경우:
Eden:      [A][B][C][D][E]
Survivor0: [X][Y][Z] ← 이미 가득 참
Survivor1: [      ] (To)

Minor GC 시:
- A, B, C, D, E 중 살아남은 객체 + X, Y, Z 중 살아남은 객체
- Survivor1에 다 안 들어감!
- → 일부가 Old Gen으로 강제 승격 (Premature Promotion)
```

이렇게 되면 수명이 짧은 객체가 Old Gen에 쌓여 **Full GC 빈도 증가**.

```bash
# Survivor 비율 조정으로 해결
-XX:SurvivorRatio=6  # Eden:S0:S1 = 6:1:1
```

> 출처: [Sizing the Generations - Oracle](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/sizing.html)

---

### 4.5 전체 과정 시각화

```
[객체 A의 생애]

1. 탄생 (Eden에 할당)
   ┌─────────────────────────────────────────┐
   │ Eden: [A(new)]                          │
   │ S0: [ ]  S1: [ ]  Old: [ ]              │
   └─────────────────────────────────────────┘

2. 첫 번째 Minor GC 생존 (S0으로 이동, age=1)
   ┌─────────────────────────────────────────┐
   │ Eden: [ ]                               │
   │ S0: [A(1)]  S1: [ ]  Old: [ ]           │
   └─────────────────────────────────────────┘

3. 두 번째 Minor GC 생존 (S1으로 이동, age=2)
   ┌─────────────────────────────────────────┐
   │ Eden: [ ]                               │
   │ S0: [ ]  S1: [A(2)]  Old: [ ]           │
   └─────────────────────────────────────────┘

4. ... (반복, age 증가)

15. 15번째 Minor GC (Old Gen으로 Promotion)
   ┌─────────────────────────────────────────┐
   │ Eden: [ ]                               │
   │ S0: [ ]  S1: [ ]  Old: [A]              │
   └─────────────────────────────────────────┘

16. Old Gen에서 Major/Full GC 때까지 살아있음
    (또는 더 이상 참조되지 않으면 Major GC에서 수집됨)
```

---

### 4.6 Minor GC의 성능 특성

**왜 Minor GC가 빠른가?**

1. **Copying GC 방식**: Mark-Sweep-Compact가 아니라 살아있는 것만 복사
2. **Young Gen만 스캔**: 전체 힙이 아닌 작은 영역만
3. **대부분 죽어있음**: 복사할 객체가 적음 (Weak Generational Hypothesis)

```
전형적인 Minor GC:
- Eden 크기: 256MB
- 살아남는 객체: 1~5MB (전체의 1~2%)
- 소요 시간: 5~50ms
```

**Card Table: Old Gen → Young Gen 참조 추적**

Old Gen 객체가 Young Gen 객체를 참조하면 문제가 생긴다.

```
Old Gen: [X] → [A] (Eden)

Minor GC 시 X는 스캔 대상이 아님
→ A가 살아있는지 어떻게 알지?
→ Old Gen 전체를 스캔? (그럼 Minor GC 의미 없음)
```

이를 해결하기 위해 **Card Table** 사용:

```
┌─────────────────────────────────────┐
│ Old Generation                      │
│ [Card 0][Card 1][Card 2][Card 3]... │
│   512B    512B    512B    512B      │
└─────────────────────────────────────┘
          ↓
┌─────────────────────────────────────┐
│ Card Table (1 byte per card)        │
│ [0][1][0][0]...                     │
│     ↑                               │
│   Dirty! (Young Gen 참조 있음)      │
└─────────────────────────────────────┘
```

- Old Gen을 512B 단위 Card로 나눔
- Card 내 객체가 Young Gen을 참조하면 해당 Card를 **Dirty**로 표시
- Minor GC 시 Dirty Card만 추가로 스캔
- **Write Barrier**: 참조 대입 시 Card Table 업데이트

```java
// Write Barrier (JVM이 자동 삽입)
oldObject.field = youngObject;
// → Card Table[oldObject의 card index] = DIRTY;
```

> 출처: [Understanding GC: Card Tables - Oracle Blogs](https://blogs.oracle.com/jonthecollector/entry/our_collectors)

---

### 4.7 Minor GC 로그 읽기

```bash
# GC 로그 활성화
java -Xlog:gc*:file=gc.log:time,uptime,level,tags -jar app.jar
```

실제 로그 예시:
```
[0.532s][info][gc,start    ] GC(0) Pause Young (Normal) (G1 Evacuation Pause)
[0.532s][info][gc,task     ] GC(0) Using 4 workers of 4 for evacuation
[0.535s][info][gc,phases   ] GC(0)   Pre Evacuate Collection Set: 0.1ms
[0.535s][info][gc,phases   ] GC(0)   Merge Heap Roots: 0.1ms
[0.535s][info][gc,phases   ] GC(0)   Evacuate Collection Set: 2.5ms
[0.535s][info][gc,phases   ] GC(0)   Post Evacuate Collection Set: 0.4ms
[0.535s][info][gc,phases   ] GC(0)   Other: 0.2ms
[0.535s][info][gc,heap     ] GC(0) Eden regions: 6->0(8)
[0.535s][info][gc,heap     ] GC(0) Survivor regions: 0->1(1)
[0.535s][info][gc,heap     ] GC(0) Old regions: 0->0
[0.535s][info][gc,heap     ] GC(0) Humongous regions: 0->0
[0.535s][info][gc          ] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 24M->4M(256M) 3.245ms
```

해석:
- `Eden regions: 6->0(8)`: Eden 6개 region 사용 → 0개로 (최대 8개)
- `Survivor regions: 0->1(1)`: Survivor 0 → 1개 사용
- `24M->4M(256M)`: 힙 24MB 사용 → 4MB로 줄음 (전체 256MB)
- `3.245ms`: GC 소요 시간

> 출처: [Analyze G1 GC logs - Oracle](https://docs.oracle.com/en/java/javase/17/gctuning/garbage-first-g1-garbage-collector1.html)

---

## 5. GC 종류

| GC 타입 | 대상 영역 | 특징 |
|---------|----------|------|
| Minor GC | Young Gen | 자주 발생, 빠름 |
| Major GC | Old Gen | 덜 발생, 느림 |
| Full GC | 전체 Heap | 가장 느림, 피해야 함 |

Minor GC는 보통 수 ms ~ 수십 ms. Full GC는 수백 ms ~ 수 초가 걸릴 수 있다.

> 출처: [Understanding JVM and Garbage Collection - DZone](https://dzone.com/articles/understanding-the-java-memory-model-and-the-garbag)

---

## 6. Mark-and-Sweep 알고리즘

가장 기본적인 GC 알고리즘.

### 동작 방식

**1단계: Mark**

GC Root(스택, static 변수, JNI 참조 등)에서 시작하여 참조를 따라가며 **살아있는 객체에 표시**.

```
Mark 전:
[Root] → [A] → [B]
         ↓
        [C]

[D] [E]  ← 아무도 참조 안 함

Mark 후:
[Root] → [A✓] → [B✓]
          ↓
         [C✓]

[D] [E]  ← 표시 없음
```

**2단계: Sweep**

표시되지 않은 객체를 메모리에서 제거하고, 해제된 메모리를 free list에 추가.

> 출처: [Mark-and-Sweep: Garbage Collection Algorithm - GeeksforGeeks](https://www.geeksforgeeks.org/java/mark-and-sweep-garbage-collection-algorithm/)

### Mark-and-Sweep의 장점

- **순환 참조 처리 가능**: Reference Counting과 달리 순환 참조도 수집 가능
- **추가 오버헤드 없음**: 객체 할당 시 별도 작업 불필요

### Mark-and-Sweep의 단점

#### 1. Stop-The-World (STW)

GC가 동작하는 동안 **애플리케이션이 멈춘다**.

```
[애플리케이션 실행] → [GC 시작 - 멈춤] → [GC 끝 - 재개]
                         ↑
                   이 시간이 문제
```

> "JVM pauses our application from running, whenever a GC event runs."

실시간 응답이 중요한 서비스에서 수백 ms씩 멈추면 치명적이다.

> 출처: [Stop-the-World Events: Why Java GC Freezes Your Application - GCeasy](https://blog.gceasy.io/stop-the-world-events-why-java-gc-freezes-your-application/)

#### 2. 메모리 단편화 (Fragmentation)

Sweep 후 메모리가 듬성듬성해진다.

```
Sweep 전: [A][B][C][D][E]
Sweep 후: [A][  ][C][  ][E]
               ↑     ↑
            빈 공간들
```

총 빈 공간은 충분한데, **연속된 공간이 없어서** 큰 객체를 할당 못 할 수 있다.

#### 3. 전체 힙 스캔

살아있는 객체를 찾기 위해 **전체 힙을 스캔**해야 한다. 힙이 클수록 오래 걸린다.

> 출처: [How the Mark-Sweep-Compact Algorithm Works - GCeasy](https://blog.gceasy.io/how-the-mark-sweep-compact-algorithm-works/)

---

## 7. Mark-Sweep-Compact

단편화 문제를 해결하기 위해 **Compact** 단계 추가.

```
Mark:    [A✓][B][C✓][D][E✓]
Sweep:   [A✓][  ][C✓][  ][E✓]
Compact: [A✓][C✓][E✓][      ]
                      ↑
                연속된 빈 공간
```

### 장점
- 메모리 단편화 해결
- 새 객체 할당이 빠름 (bump-the-pointer)

### 단점
- Compact 과정에서 객체 이동 → 참조 주소 업데이트 필요 → **더 긴 STW**

> 출처: [How the Mark-Sweep-Compact Algorithm Works - GCeasy](https://blog.gceasy.io/how-the-mark-sweep-compact-algorithm-works/)

---

## 8. JVM의 GC 종류

### Serial GC

```bash
-XX:+UseSerialGC
```

- 싱글 스레드로 GC 수행
- STW 시간이 김
- 작은 힙, 클라이언트 애플리케이션에 적합

### Parallel GC

```bash
-XX:+UseParallelGC
```

- 멀티 스레드로 GC 수행
- **처리량(Throughput) 최적화**
- Java 8 기본 GC

### G1 GC (Garbage-First)

```bash
-XX:+UseG1GC
```

- 힙을 작은 **Region**으로 나눔
- 가비지가 많은 Region부터 수집
- **지연시간과 처리량의 균형**
- Java 9+ 기본 GC

```
┌────┬────┬────┬────┐
│ E  │ S  │ O  │ O  │  E: Eden
├────┼────┼────┼────┤  S: Survivor
│ O  │ E  │ E  │ O  │  O: Old
├────┼────┼────┼────┤  H: Humongous
│ E  │ O  │ S  │ H  │
└────┴────┴────┴────┘
```

> 출처: [JDK GCs Comparison - Inside.java](https://inside.java/2022/06/06/sip054/)

### ZGC

```bash
-XX:+UseZGC
```

- **STW 10ms 미만** 목표 (보통 250μs 이하)
- 대용량 힙(최대 16TB)에서도 짧은 지연
- 거의 모든 작업을 애플리케이션과 **동시 수행**
- Java 15+ 정식 지원

### Shenandoah

```bash
-XX:+UseShenandoahGC
```

- ZGC와 비슷한 저지연 목표
- Red Hat에서 개발
- 힙 크기와 무관하게 일정한 pause time

> 출처: [How to choose the best Java garbage collector - Red Hat Developer](https://developers.redhat.com/articles/2021/11/02/how-choose-best-java-garbage-collector)

---

## 9. G1 vs ZGC 비교

| 항목 | G1 GC | ZGC |
|------|-------|-----|
| STW 시간 | 수십~수백 ms | < 10ms (보통 < 1ms) |
| 최대 힙 크기 | 수십 GB 권장 | 최대 16TB |
| CPU 오버헤드 | 낮음 | 높음 |
| 메모리 오버헤드 | 낮음 | 높음 |
| 적합한 상황 | 일반적인 웹 서비스 | 초저지연 필수 서비스 |

### 언제 G1을 쓸까?
- 힙 크기 32GB 이하
- 적당한 지연시간 허용 (수십~수백 ms)
- CPU/메모리 리소스 제한

### 언제 ZGC를 쓸까?
- 초저지연 필수 (트레이딩, 게임 서버)
- 대용량 힙 (수백 GB 이상)
- 리소스 여유 있음

> 출처: [Enhancing Java Performance: G1GC to ZGC at Halodoc](https://blogs.halodoc.io/enhancing-java-application-performance-transitioning-from-g1gc-to-zgc-at-halodoc/)

---

## 10. GC 튜닝 기본

### 힙 크기 설정

```bash
java -Xms512m -Xmx2g -jar app.jar
```

- `-Xms`: 초기 힙 크기
- `-Xmx`: 최대 힙 크기

**Tip**: Xms와 Xmx를 같게 설정하면 힙 리사이징 오버헤드를 줄일 수 있다.

### GC 로그 활성화

```bash
# Java 9+
java -Xlog:gc*:file=gc.log:time -jar app.jar

# Java 8
java -XX:+PrintGCDetails -XX:+PrintGCDateStamps -Xloggc:gc.log -jar app.jar
```

### Young/Old 비율 조정

```bash
# Young Gen을 전체의 1/3으로 (기본은 1/3)
-XX:NewRatio=2

# Survivor 영역 크기 조정
-XX:SurvivorRatio=8
```

> 출처: [Sizing the Generations - Oracle](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/sizing.html)

---

## 11. GC 관련 문제 상황

### 1. Full GC가 자주 발생

**증상**: 주기적으로 애플리케이션이 느려짐

**원인**:
- Old Gen이 자주 차는 경우
- 메모리 누수
- Premature Promotion (객체가 너무 빨리 Old Gen으로 이동)

**해결**:
- 힙 덤프 분석 (`jmap`, VisualVM, Eclipse MAT)
- 불필요한 객체 참조 제거
- Young Gen 크기 증가

### 2. OOM (OutOfMemoryError)

```
java.lang.OutOfMemoryError: Java heap space
```

**원인**:
- 힙 크기 부족
- 메모리 누수

**해결**:
- 힙 크기 증가 (`-Xmx`)
- 메모리 누수 찾아서 수정
- 힙 덤프 분석

### 3. GC Overhead Limit Exceeded

```
java.lang.OutOfMemoryError: GC overhead limit exceeded
```

**의미**: GC에 전체 시간의 98% 이상 사용, 힙의 2% 미만만 회수

**원인**: 거의 OOM 상태. 살아있는 객체가 힙 대부분을 차지.

> 출처: [9 Tips to Reduce Long Garbage Collection Pauses - GCeasy](https://blog.gceasy.io/reduce-long-garbage-collection-pauses/)

---

## 12. 실무에서의 GC

### 대부분의 경우

**기본 설정으로 충분하다.**

G1 GC가 기본이고, 대부분의 워크로드에서 잘 동작한다. **문제가 생기기 전에 튜닝하지 마라**.

### 튜닝이 필요한 경우

1. GC 로그에서 **긴 STW 시간**이 관찰될 때
2. **OOM**이 발생할 때
3. 특수한 요구사항 (초저지연, 대용량 힙 등)

### Spring Boot 권장 설정

```bash
# 일반적인 웹 애플리케이션
java -Xms512m -Xmx512m -XX:+UseG1GC -jar app.jar

# 저지연이 중요한 경우 (Java 17+)
java -Xms1g -Xmx1g -XX:+UseZGC -jar app.jar
```

---

## 13. 정리

| 알고리즘 | 장점 | 단점 |
|----------|------|------|
| Mark-and-Sweep | 단순함, 순환 참조 처리 | STW, 단편화 |
| Mark-Sweep-Compact | 단편화 해결 | 더 긴 STW |
| Copying (Young Gen) | 빠름, 단편화 없음 | 메모리 2배 필요 |
| G1 | 예측 가능한 STW, 균형 | 복잡한 내부 구조 |
| ZGC | 초저지연 (< 10ms) | CPU/메모리 오버헤드 |

### 핵심 포인트

1. **GC는 공짜가 아니다** - STW가 발생한다
2. **대부분은 기본 설정으로 충분하다** - 섣부른 최적화 금지
3. **문제가 생기면 GC 로그부터 확인** - 추측하지 말고 측정하라
4. **메모리 누수 먼저 해결** - GC 튜닝보다 코드 수정이 우선

---

## 참고 자료

- [Java Garbage Collection Basics - Oracle](https://www.oracle.com/technetwork/tutorials/tutorials-1873457.html)
- [Generations - Oracle Java SE 8 GC Tuning Guide](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/generations.html)
- [Mark-and-Sweep: Garbage Collection Algorithm - GeeksforGeeks](https://www.geeksforgeeks.org/java/mark-and-sweep-garbage-collection-algorithm/)
- [How the Mark-Sweep-Compact Algorithm Works - GCeasy](https://blog.gceasy.io/how-the-mark-sweep-compact-algorithm-works/)
- [Stop-the-World Events: Why Java GC Freezes Your Application - GCeasy](https://blog.gceasy.io/stop-the-world-events-why-java-gc-freezes-your-application/)
- [9 Tips to Reduce Long Garbage Collection Pauses - GCeasy](https://blog.gceasy.io/reduce-long-garbage-collection-pauses/)
- [JDK GCs Comparison - Inside.java](https://inside.java/2022/06/06/sip054/)
- [How to choose the best Java garbage collector - Red Hat Developer](https://developers.redhat.com/articles/2021/11/02/how-choose-best-java-garbage-collector)
- [Enhancing Java Performance: G1GC to ZGC at Halodoc](https://blogs.halodoc.io/enhancing-java-application-performance-transitioning-from-g1gc-to-zgc-at-halodoc/)
- [Sizing the Generations - Oracle](https://docs.oracle.com/javase/8/docs/technotes/guides/vm/gctuning/sizing.html)
