package com.saamsoft.saamerp.crm.internal;

import com.saamsoft.saamerp.crm.Crm.*;
import com.saamsoft.saamerp.tenancy.TenantId;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("postgres")
@Transactional
public class CrmService {
  private final JdbcTemplate db;

  public CrmService(JdbcTemplate db) {
    this.db = db;
  }

  private static String text(String value, int max) {
    if (value == null || value.isBlank() || value.trim().length() > max)
      throw new IllegalArgumentException("Required text is missing or too long");
    return value.trim();
  }

  private static String email(String value) {
    if (value == null || value.isBlank()) return "";
    if (value.length() > 200 || !value.trim().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+"))
      throw new IllegalArgumentException("Enter a valid email address");
    return value.trim();
  }

  private static LocalDate date(String value) {
    try {
      var date = LocalDate.parse(value);
      if (date.isBefore(LocalDate.now(ZoneOffset.UTC)))
        throw new IllegalArgumentException("Validity date cannot be in the past");
      return date;
    } catch (java.time.format.DateTimeParseException | NullPointerException e) {
      throw new IllegalArgumentException("Enter a valid quotation date");
    }
  }

  static class Missing extends RuntimeException {
    Missing() {
      super("Record not found in this workspace");
    }
  }

  static class Conflict extends RuntimeException {
    Conflict(String message) {
      super(message);
    }
  }

  Customer customer(TenantId tenant, UUID id) {
    return db
        .query(
            "SELECT * FROM crm_customer WHERE tenant_id=? AND id=?",
            (r, n) ->
                new Customer(
                    r.getObject("id", UUID.class),
                    r.getString("branch"),
                    r.getString("name"),
                    r.getString("email")),
            tenant.value(),
            id)
        .stream()
        .findFirst()
        .orElseThrow(Missing::new);
  }

  public Customer createCustomer(TenantId tenant, NewCustomer input) {
    if (input == null
        || !Set.of("Lagos · Head office", "Abuja · Demo branch")
            .contains(Objects.toString(input.branch(), "")))
      throw new IllegalArgumentException("Select a demo branch");
    var c =
        new Customer(
            UUID.randomUUID(), input.branch(), text(input.name(), 160), email(input.email()));
    db.update(
        "INSERT INTO crm_customer(tenant_id,id,branch,name,email) VALUES (?,?,?,?,?)",
        tenant.value(),
        c.id(),
        c.branch(),
        c.name(),
        c.email());
    return c;
  }

  public Contact createContact(TenantId tenant, NewContact input) {
    if (input == null || input.customerId() == null)
      throw new IllegalArgumentException("Select a customer");
    customer(tenant, input.customerId());
    var c =
        new Contact(
            UUID.randomUUID(), input.customerId(), text(input.name(), 160), email(input.email()));
    db.update(
        "INSERT INTO crm_contact(tenant_id,id,customer_id,name,email) VALUES (?,?,?,?,?)",
        tenant.value(),
        c.id(),
        c.customerId(),
        c.name(),
        c.email());
    return c;
  }

  private List<Line> lines(TenantId tenant, UUID id) {
    return db.query(
        "SELECT * FROM crm_quote_line WHERE tenant_id=? AND quote_id=? ORDER BY position",
        (r, n) ->
            new Line(
                r.getString("description"), r.getInt("quantity"), r.getLong("unit_price_minor")),
        tenant.value(),
        id);
  }

  private Quote quoteRow(TenantId tenant, ResultSet r) throws SQLException {
    var id = r.getObject("id", UUID.class);
    return new Quote(
        id,
        r.getString("number"),
        r.getObject("customer_id", UUID.class),
        r.getObject("contact_id", UUID.class),
        r.getString("branch"),
        r.getString("customer_name"),
        r.getString("contact_name"),
        r.getDate("valid_until").toString(),
        r.getString("status"),
        r.getString("currency"),
        lines(tenant, id),
        r.getLong("total_minor"));
  }

  public Quote quote(TenantId tenant, UUID id) {
    return db
        .query(
            "SELECT * FROM crm_quote WHERE tenant_id=? AND id=?",
            (r, n) -> quoteRow(tenant, r),
            tenant.value(),
            id)
        .stream()
        .findFirst()
        .orElseThrow(Missing::new);
  }

  public Quote createQuote(TenantId tenant, NewQuote input) {
    if (input == null
        || input.customerId() == null
        || input.lines() == null
        || input.lines().isEmpty()
        || input.lines().size() > 100)
      throw new IllegalArgumentException("Select a customer and provide 1–100 lines");
    var c = customer(tenant, input.customerId());
    var validUntil = date(input.validUntil());
    var contactName = "";
    if (input.contactId() != null)
      contactName =
          db
              .query(
                  "SELECT name FROM crm_contact WHERE tenant_id=? AND customer_id=? AND id=?",
                  (r, n) -> r.getString(1),
                  tenant.value(),
                  c.id(),
                  input.contactId())
              .stream()
              .findFirst()
              .orElseThrow(Missing::new);
    long total = 0;
    for (var line : input.lines()) {
      if (line == null) throw new IllegalArgumentException("Invalid line");
      text(line.description(), 240);
      if (line.quantity() < 1
          || line.quantity() > 10000
          || line.unitPriceMinor() < 1
          || line.unitPriceMinor() > 100000000000L)
        throw new IllegalArgumentException("Quantity or price is outside the permitted range");
      total = Math.addExact(total, Math.multiplyExact(line.quantity(), line.unitPriceMinor()));
    }
    if (total > 900000000000000L)
      throw new IllegalArgumentException("Quotation total is too large");
    var id = UUID.randomUUID();
    var number = "Q-" + id.toString().substring(0, 18).toUpperCase(Locale.ROOT);
    db.update(
        "INSERT INTO"
            + " crm_quote(tenant_id,id,number,customer_id,contact_id,branch,customer_name,contact_name,valid_until,total_minor)"
            + " VALUES (?,?,?,?,?,?,?,?,?,?)",
        tenant.value(),
        id,
        number,
        c.id(),
        input.contactId(),
        c.branch(),
        c.name(),
        contactName,
        validUntil,
        total);
    for (int position = 0; position < input.lines().size(); position++) {
      var line = input.lines().get(position);
      db.update(
          "INSERT INTO crm_quote_line VALUES (?,?,?,?,?,?)",
          tenant.value(),
          id,
          position,
          line.description().trim(),
          line.quantity(),
          line.unitPriceMinor());
    }
    db.update(
        "INSERT INTO crm_quote_event(tenant_id,quote_id,status) VALUES (?,?,'DRAFT')",
        tenant.value(),
        id);
    return quote(tenant, id);
  }

  public Quote transition(TenantId tenant, UUID id, String status) {
    // Row lock serializes issue/accept/reject attempts and preserves the issued snapshot.
    var current =
        db
            .query(
                "SELECT status FROM crm_quote WHERE tenant_id=? AND id=? FOR UPDATE",
                (r, n) -> r.getString(1),
                tenant.value(),
                id)
            .stream()
            .findFirst()
            .orElseThrow(Missing::new);
    var q = quote(tenant, id);
    if (current.equals(status)) return q;
    boolean permitted =
        (current.equals("DRAFT") && "SENT".equals(status))
            || (current.equals("SENT")
                && Set.of("ACCEPTED", "REJECTED").contains(Objects.toString(status, "")));
    if (!permitted) throw new Conflict("Invalid quotation status transition");
    if (!"REJECTED".equals(status)) date(q.validUntil());
    if (current.equals("DRAFT")) {
      var c = customer(tenant, q.customerId());
      String contactName =
          q.contactId() == null
              ? ""
              : db.queryForObject(
                  "SELECT name FROM crm_contact WHERE tenant_id=? AND id=?",
                  String.class,
                  tenant.value(),
                  q.contactId());
      db.update(
          "UPDATE crm_quote SET customer_name=?,contact_name=? WHERE tenant_id=? AND id=?",
          c.name(),
          contactName,
          tenant.value(),
          id);
    }
    db.update(
        "UPDATE crm_quote SET status=? WHERE tenant_id=? AND id=?", status, tenant.value(), id);
    db.update(
        "INSERT INTO crm_quote_event(tenant_id,quote_id,status) VALUES (?,?,?)",
        tenant.value(),
        id,
        status);
    return quote(tenant, id);
  }

  @Transactional(readOnly = true)
  public Dataset dataset(TenantId tenant) {
    var customers =
        db.query(
            "SELECT * FROM crm_customer WHERE tenant_id=? ORDER BY name,id",
            (r, n) ->
                new Customer(
                    r.getObject("id", UUID.class),
                    r.getString("branch"),
                    r.getString("name"),
                    r.getString("email")),
            tenant.value());
    var contacts =
        db.query(
            "SELECT * FROM crm_contact WHERE tenant_id=? ORDER BY name,id",
            (r, n) ->
                new Contact(
                    r.getObject("id", UUID.class),
                    r.getObject("customer_id", UUID.class),
                    r.getString("name"),
                    r.getString("email")),
            tenant.value());
    var quotes =
        db.query(
            "SELECT * FROM crm_quote WHERE tenant_id=? ORDER BY number",
            (r, n) -> quoteRow(tenant, r),
            tenant.value());
    return new Dataset(1, "synthetic", customers, contacts, quotes);
  }
}
