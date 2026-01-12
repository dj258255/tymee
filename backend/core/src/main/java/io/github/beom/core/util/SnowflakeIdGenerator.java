package io.github.beom.core.util;

import java.net.NetworkInterface;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Enumeration;
import org.springframework.stereotype.Component;

/**
 * Twitter Snowflake 알고리즘 기반 분산 ID 생성기.
 *
 * <p>구조 (64비트):
 *
 * <ul>
 *   <li>1비트: 부호 (항상 0)
 *   <li>41비트: 타임스탬프 (약 69년)
 *   <li>10비트: 머신 ID (1024개 노드)
 *   <li>12비트: 시퀀스 (밀리초당 4096개)
 * </ul>
 */
@Component
public class SnowflakeIdGenerator {

  private static final long EPOCH = 1704067200000L; // 2024-01-01 00:00:00 UTC
  private static final long MACHINE_ID_BITS = 10L;
  private static final long SEQUENCE_BITS = 12L;

  private static final long MAX_MACHINE_ID = ~(-1L << MACHINE_ID_BITS);
  private static final long MAX_SEQUENCE = ~(-1L << SEQUENCE_BITS);

  private static final long MACHINE_ID_SHIFT = SEQUENCE_BITS;
  private static final long TIMESTAMP_SHIFT = SEQUENCE_BITS + MACHINE_ID_BITS;

  private final long machineId;
  private long sequence = 0L;
  private long lastTimestamp = -1L;

  public SnowflakeIdGenerator() {
    this.machineId = createMachineId();
  }

  public SnowflakeIdGenerator(long machineId) {
    if (machineId < 0 || machineId > MAX_MACHINE_ID) {
      throw new IllegalArgumentException("Machine ID must be between 0 and " + MAX_MACHINE_ID);
    }
    this.machineId = machineId;
  }

  public synchronized long nextId() {
    long currentTimestamp = timestamp();

    if (currentTimestamp < lastTimestamp) {
      throw new IllegalStateException("Clock moved backwards. Refusing to generate id.");
    }

    if (currentTimestamp == lastTimestamp) {
      sequence = (sequence + 1) & MAX_SEQUENCE;
      if (sequence == 0) {
        currentTimestamp = waitNextMillis(currentTimestamp);
      }
    } else {
      sequence = 0;
    }

    lastTimestamp = currentTimestamp;

    return ((currentTimestamp - EPOCH) << TIMESTAMP_SHIFT)
        | (machineId << MACHINE_ID_SHIFT)
        | sequence;
  }

  private long timestamp() {
    return Instant.now().toEpochMilli();
  }

  private long waitNextMillis(long currentTimestamp) {
    while (currentTimestamp <= lastTimestamp) {
      currentTimestamp = timestamp();
    }
    return currentTimestamp;
  }

  private long createMachineId() {
    long id;
    try {
      StringBuilder sb = new StringBuilder();
      Enumeration<NetworkInterface> networkInterfaces = NetworkInterface.getNetworkInterfaces();
      while (networkInterfaces.hasMoreElements()) {
        NetworkInterface networkInterface = networkInterfaces.nextElement();
        byte[] mac = networkInterface.getHardwareAddress();
        if (mac != null) {
          for (byte b : mac) {
            sb.append(String.format("%02X", b));
          }
        }
      }
      id = sb.toString().hashCode();
    } catch (Exception e) {
      id = new SecureRandom().nextInt();
    }
    return id & MAX_MACHINE_ID;
  }
}
