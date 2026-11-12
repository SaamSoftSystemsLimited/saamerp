package com.saamsoft.saamerp.crm.internal;

import static org.assertj.core.api.Assertions.*;

import com.saamsoft.saamerp.crm.Crm.*;
import com.saamsoft.saamerp.tenancy.TenantId;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(
    webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
    properties = {
      "CRM_DATABASE_URL=${CRM_TEST_DATABASE_URL}", "CRM_DATABASE_USER=${CRM_TEST_DATABASE_USER}",
      "CRM_DATABASE_PASSWORD=${CRM_TEST_DATABASE_PASSWORD}",
          "CRM_DEMO_PASSWORD=integration-test-only-password"
    })
@ActiveProfiles("postgres")
@EnabledIfEnvironmentVariable(named = "CRM_TEST_DATABASE_URL", matches = ".+")
class CrmPostgresTest {
  @Autowired CrmService service;
  @Autowired JdbcTemplate db;
  @LocalServerPort int port;

  TenantId tenant() {
    return new TenantId(UUID.randomUUID());
  }

  Customer customer(TenantId t, String name) {
    return service.createCustomer(
        t, new NewCustomer("Lagos · Head office", name, "demo@example.test"));
  }

  NewQuote request(UUID customer, UUID contact, List<Line> lines) {
    return new NewQuote(customer, contact, "2099-12-31", lines);
  }

  @Test
  void tenantReferencesCannotCrossBoundaries() {
    var a = tenant();
    var b = tenant();
    var c = customer(a, "Synthetic customer");
    assertThat(service.dataset(b).customers()).isEmpty();
    assertThatThrownBy(() -> service.createContact(b, new NewContact(c.id(), "Other tenant", "")))
        .isInstanceOf(CrmService.Missing.class);
    assertThatThrownBy(
            () ->
                service.createQuote(
                    b, request(c.id(), null, List.of(new Line("Training", 1, 100)))))
        .isInstanceOf(CrmService.Missing.class);
    var other = customer(a, "Other customer");
    var contact =
        service.createContact(a, new NewContact(other.id(), "Wrong customer contact", ""));
    assertThatThrownBy(
            () ->
                service.createQuote(
                    a, request(c.id(), contact.id(), List.of(new Line("Training", 1, 100)))))
        .isInstanceOf(CrmService.Missing.class);
    assertThatThrownBy(
            () ->
                db.update(
                    "INSERT INTO crm_contact VALUES (?,?,?,?,?)",
                    b.value(),
                    UUID.randomUUID(),
                    c.id(),
                    "Forbidden",
                    ""))
        .isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
  }

  @Test
  void totalsSnapshotTransitionsAndRetryAreControlled() {
    var t = tenant();
    var c = customer(t, "Original customer");
    var person = service.createContact(t, new NewContact(c.id(), "Original contact", ""));
    var q =
        service.createQuote(
            t,
            request(
                c.id(),
                person.id(),
                List.of(new Line("Consulting", 3, 10025), new Line("Support", 2, 99))));
    assertThat(q.totalMinor()).isEqualTo(30273);
    assertThatThrownBy(() -> service.transition(t, q.id(), "ACCEPTED"))
        .isInstanceOf(CrmService.Conflict.class);
    service.transition(t, q.id(), "SENT");
    db.update(
        "UPDATE crm_customer SET name='Changed customer' WHERE tenant_id=? AND id=?",
        t.value(),
        c.id());
    db.update(
        "UPDATE crm_contact SET name='Changed contact' WHERE tenant_id=? AND id=?",
        t.value(),
        person.id());
    assertThat(service.transition(t, q.id(), "SENT").customerName()).isEqualTo("Original customer");
    assertThat(service.quote(t, q.id()).contactName()).isEqualTo("Original contact");
    assertThat(service.transition(t, q.id(), "ACCEPTED").status()).isEqualTo("ACCEPTED");
    assertThatThrownBy(() -> service.transition(t, q.id(), "REJECTED"))
        .isInstanceOf(CrmService.Conflict.class);
    assertThat(
            db.queryForObject(
                "SELECT count(*) FROM crm_quote_event WHERE tenant_id=? AND quote_id=?",
                Integer.class,
                t.value(),
                q.id()))
        .isEqualTo(3);
    assertThatThrownBy(() -> service.quote(tenant(), q.id()))
        .isInstanceOf(CrmService.Missing.class);
  }

  @Test
  void invalidQuotesDoNotPersistPartialRecords() {
    var t = tenant();
    var c = customer(t, "Synthetic");
    assertThatThrownBy(
            () ->
                service.createQuote(t, request(c.id(), null, List.of(new Line("Invalid", 0, 100)))))
        .isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(
            () ->
                service.createQuote(
                    t,
                    new NewQuote(c.id(), null, "2000-01-01", List.of(new Line("Expired", 1, 100)))))
        .isInstanceOf(IllegalArgumentException.class);
    assertThat(service.dataset(t).quotes()).isEmpty();
  }

  @Test
  void demoApiRequiresAuthentication() throws Exception {
    var client = HttpClient.newHttpClient();
    var url = URI.create("http://localhost:" + port + "/api/demo/crm");
    assertThat(
            client
                .send(HttpRequest.newBuilder(url).build(), HttpResponse.BodyHandlers.ofString())
                .statusCode())
        .isEqualTo(401);
    String auth =
        Base64.getEncoder()
            .encodeToString(
                "demo:integration-test-only-password"
                    .getBytes(java.nio.charset.StandardCharsets.UTF_8));
    assertThat(
            client
                .send(
                    HttpRequest.newBuilder(url).header("Authorization", "Basic " + auth).build(),
                    HttpResponse.BodyHandlers.ofString())
                .statusCode())
        .isEqualTo(200);
    var invalid =
        HttpRequest.newBuilder(URI.create(url + "/quotes"))
            .header("Authorization", "Basic " + auth)
            .header("Content-Type", "application/json")
            .POST(
                HttpRequest.BodyPublishers.ofString(
                    "{\"customerId\":\"11111111-1111-4111-8111-111111111111\",\"validUntil\":\"2099-12-31\",\"lines\":[{\"description\":\"Invalid"
                        + " fraction\",\"quantity\":1.5,\"unitPriceMinor\":100}]}"))
            .build();
    assertThat(client.send(invalid, HttpResponse.BodyHandlers.ofString()).statusCode())
        .isEqualTo(400);
  }
}
