package com.saamsoft.saamerp;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModuleBoundariesTest {
  @Test
  void domainsHaveNoCyclesOrUndeclaredDependencies() {
    var modules = ApplicationModules.of(SaamErpApplication.class);
    assertThat(modules.stream().map(module -> module.getIdentifier().toString()))
        .containsExactlyInAnyOrder("tenancy", "organization", "platform", "crm");
    modules.verify();
  }
}
