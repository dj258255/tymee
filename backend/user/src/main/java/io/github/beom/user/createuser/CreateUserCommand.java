package io.github.beom.user.createuser;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 사용자 생성 커맨드 (관리자 API - 회원가입 대신 사용 가능)
 */
@Getter
@RequiredArgsConstructor
public class CreateUserCommand {
    @NotBlank(message = "이메일은 필수입니다")
    @Email(message = "이메일 형식이 올바르지 않습니다")
    private final String email;

    @NotBlank(message = "비밀번호는 필수입니다")
    private final String password;

    @NotBlank(message = "이름은 필수입니다")
    @Size(max = 100, message = "이름이 너무 깁니다")
    private final String name;
}