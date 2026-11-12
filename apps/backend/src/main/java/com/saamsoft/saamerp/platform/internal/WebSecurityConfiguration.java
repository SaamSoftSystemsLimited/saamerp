package com.saamsoft.saamerp.platform.internal;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@org.springframework.context.annotation.Profile("!postgres")
@Configuration(proxyBeanMethods = false)
class WebSecurityConfiguration {
  @Bean
  SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    // No business endpoints or authentication provider exist yet.
    return http.authorizeHttpRequests(
            requests ->
                requests.requestMatchers("/actuator/health").permitAll().anyRequest().denyAll())
        .build();
  }
}
