package com.saamsoft.saamerp.crm.internal;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/** Runner/local demo only: one fixed synthetic tenant. Not production identity management. */
@Configuration(proxyBeanMethods = false)
@Profile("postgres")
class DemoSecurity {
  @Bean
  UserDetailsService demoUsers(@Value("${CRM_DEMO_PASSWORD}") String password) {
    if (password.length() < 16)
      throw new IllegalArgumentException("CRM_DEMO_PASSWORD must contain at least 16 characters");
    return new InMemoryUserDetailsManager(
        User.withUsername("demo")
            .password("{bcrypt}" + new BCryptPasswordEncoder().encode(password))
            .roles("DEMO")
            .build());
  }

  @Bean
  SecurityFilterChain demoSecurityFilterChain(HttpSecurity http) throws Exception {
    return http.securityMatcher("/**")
        // Stateless Basic auth is for scripted runner requests, not browser sessions.
        .csrf(csrf -> csrf.ignoringRequestMatchers("/api/demo/crm/**"))
        .sessionManagement(
            s ->
                s.sessionCreationPolicy(
                    org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            a ->
                a.dispatcherTypeMatchers(jakarta.servlet.DispatcherType.ERROR)
                    .permitAll()
                    .requestMatchers("/actuator/health")
                    .permitAll()
                    .requestMatchers("/api/demo/crm/**")
                    .hasRole("DEMO")
                    .anyRequest()
                    .denyAll())
        .httpBasic(Customizer.withDefaults())
        .build();
  }
}
