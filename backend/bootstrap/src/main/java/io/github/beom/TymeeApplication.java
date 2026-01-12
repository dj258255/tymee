package io.github.beom;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class TymeeApplication {

  public static void main(String[] args) {
    SpringApplication.run(TymeeApplication.class, args);
  }
}
