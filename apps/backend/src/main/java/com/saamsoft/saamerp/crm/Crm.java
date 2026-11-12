package com.saamsoft.saamerp.crm;

import java.util.List;
import java.util.UUID;

/** Public CRM boundary. Money is integer kobo; the initial quotation currency is NGN. */
public final class Crm {
  private Crm() {}

  public record Customer(UUID id, String branch, String name, String email) {}

  public record Contact(UUID id, UUID customerId, String name, String email) {}

  public record Line(String description, int quantity, long unitPriceMinor) {}

  public record Quote(
      UUID id,
      String number,
      UUID customerId,
      UUID contactId,
      String branch,
      String customerName,
      String contactName,
      String validUntil,
      String status,
      String currency,
      List<Line> lines,
      long totalMinor) {}

  public record Dataset(
      int version,
      String mode,
      List<Customer> customers,
      List<Contact> contacts,
      List<Quote> quotes) {}

  public record NewCustomer(String branch, String name, String email) {}

  public record NewContact(UUID customerId, String name, String email) {}

  public record NewQuote(UUID customerId, UUID contactId, String validUntil, List<Line> lines) {}

  public record Transition(String status) {}
}
