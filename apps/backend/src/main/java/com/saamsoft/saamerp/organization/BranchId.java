package com.saamsoft.saamerp.organization;

import com.saamsoft.saamerp.tenancy.TenantId;
import java.util.Objects;
import java.util.UUID;

/** Branch identity includes its owning customer to avoid ambiguous references. */
public record BranchId(TenantId tenantId, UUID value) {
    public BranchId {
        Objects.requireNonNull(tenantId, "Owning tenant is required");
        Objects.requireNonNull(value, "Branch ID is required");
    }
}
