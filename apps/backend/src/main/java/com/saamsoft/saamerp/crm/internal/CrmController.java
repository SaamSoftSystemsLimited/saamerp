package com.saamsoft.saamerp.crm.internal;

import com.saamsoft.saamerp.crm.Crm.*;
import com.saamsoft.saamerp.tenancy.TenantId;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@Profile("postgres")
@RequestMapping("/api/demo/crm")
class CrmController {
  // Never obtain tenant ownership from request headers, body or query strings.
  private static final TenantId DEMO =
      new TenantId(UUID.fromString("11111111-1111-4111-8111-111111111111"));
  private final CrmService service;

  CrmController(CrmService service) {
    this.service = service;
  }

  @GetMapping
  Dataset data() {
    return service.dataset(DEMO);
  }

  @PostMapping("/customers")
  @ResponseStatus(HttpStatus.CREATED)
  Customer customer(@RequestBody NewCustomer body) {
    return service.createCustomer(DEMO, body);
  }

  @PostMapping("/contacts")
  @ResponseStatus(HttpStatus.CREATED)
  Contact contact(@RequestBody NewContact body) {
    return service.createContact(DEMO, body);
  }

  @PostMapping("/quotes")
  @ResponseStatus(HttpStatus.CREATED)
  Quote quote(@RequestBody NewQuote body) {
    return service.createQuote(DEMO, body);
  }

  @PostMapping("/quotes/{id}/status")
  Quote status(@PathVariable UUID id, @RequestBody Transition body) {
    return service.transition(DEMO, id, body.status());
  }

  record Error(String message) {}

  @ExceptionHandler(IllegalArgumentException.class)
  @ResponseStatus(HttpStatus.BAD_REQUEST)
  Error invalid(IllegalArgumentException e) {
    return new Error(e.getMessage());
  }

  @ExceptionHandler(CrmService.Missing.class)
  @ResponseStatus(HttpStatus.NOT_FOUND)
  Error missing(CrmService.Missing e) {
    return new Error(e.getMessage());
  }

  @ExceptionHandler(CrmService.Conflict.class)
  @ResponseStatus(HttpStatus.CONFLICT)
  Error conflict(CrmService.Conflict e) {
    return new Error(e.getMessage());
  }
}
