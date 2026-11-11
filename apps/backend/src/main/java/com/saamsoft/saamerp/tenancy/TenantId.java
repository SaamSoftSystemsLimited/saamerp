package com.saamsoft.saamerp.tenancy;

import java.util.Objects;
import java.util.UUID;

/** A customer identity, never proof that the caller may access that customer. */
public record TenantId(UUID value) {
    public TenantId {
        Objects.requireNonNull(value, "Tenant ID is required");
    }
}
