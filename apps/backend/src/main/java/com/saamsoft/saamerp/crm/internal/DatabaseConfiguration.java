package com.saamsoft.saamerp.crm.internal;

import com.zaxxer.hikari.HikariDataSource;
import javax.sql.DataSource;
import org.flywaydb.core.Flyway;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.JdbcTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@Configuration(proxyBeanMethods = false)
@Profile("postgres")
@EnableTransactionManagement
class DatabaseConfiguration {
  @Bean(destroyMethod = "close")
  HikariDataSource dataSource(
      @Value("${CRM_DATABASE_URL}") String url,
      @Value("${CRM_DATABASE_USER}") String user,
      @Value("${CRM_DATABASE_PASSWORD}") String password) {
    var source = new HikariDataSource();
    source.setJdbcUrl(url);
    source.setUsername(user);
    source.setPassword(password);
    source.setMaximumPoolSize(5);
    source.setMinimumIdle(0);
    return source;
  }

  @Bean(initMethod = "migrate")
  Flyway crmMigrations(DataSource source) {
    return Flyway.configure().dataSource(source).locations("classpath:db/migration").load();
  }

  @Bean
  @DependsOn("crmMigrations")
  JdbcTemplate crmJdbc(DataSource source) {
    return new JdbcTemplate(source);
  }

  @Bean
  JdbcTransactionManager transactionManager(DataSource source) {
    return new JdbcTransactionManager(source);
  }
}
