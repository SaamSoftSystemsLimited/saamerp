CREATE TABLE crm_customer (
 tenant_id uuid NOT NULL, id uuid NOT NULL,
 branch varchar(80) NOT NULL CHECK (branch IN ('Lagos · Head office','Abuja · Demo branch')),
 name varchar(160) NOT NULL CHECK (length(trim(name)) > 0), email varchar(200) NOT NULL,
 PRIMARY KEY (tenant_id,id)
);
CREATE TABLE crm_contact (
 tenant_id uuid NOT NULL, id uuid NOT NULL, customer_id uuid NOT NULL,
 name varchar(160) NOT NULL CHECK (length(trim(name)) > 0), email varchar(200) NOT NULL,
 PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,customer_id,id),
 FOREIGN KEY (tenant_id,customer_id) REFERENCES crm_customer(tenant_id,id)
);
CREATE TABLE crm_quote (
 tenant_id uuid NOT NULL, id uuid NOT NULL, number varchar(40) NOT NULL,
 customer_id uuid NOT NULL, contact_id uuid,
 branch varchar(80) NOT NULL, customer_name varchar(160) NOT NULL, contact_name varchar(160) NOT NULL,
 valid_until date NOT NULL, status varchar(16) NOT NULL DEFAULT 'DRAFT'
 CHECK (status IN ('DRAFT','SENT','ACCEPTED','REJECTED')),
 currency char(3) NOT NULL DEFAULT 'NGN' CHECK (currency = 'NGN'),
 total_minor bigint NOT NULL CHECK (total_minor > 0 AND total_minor <= 900000000000000),
 PRIMARY KEY (tenant_id,id), UNIQUE (tenant_id,number),
 FOREIGN KEY (tenant_id,customer_id) REFERENCES crm_customer(tenant_id,id),
 FOREIGN KEY (tenant_id,customer_id,contact_id) REFERENCES crm_contact(tenant_id,customer_id,id)
);
CREATE TABLE crm_quote_line (
 tenant_id uuid NOT NULL, quote_id uuid NOT NULL, position integer NOT NULL,
 description varchar(240) NOT NULL CHECK (length(trim(description)) > 0),
 quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 10000),
 unit_price_minor bigint NOT NULL CHECK (unit_price_minor BETWEEN 1 AND 100000000000),
 PRIMARY KEY (tenant_id,quote_id,position),
 FOREIGN KEY (tenant_id,quote_id) REFERENCES crm_quote(tenant_id,id)
);
CREATE TABLE crm_quote_event (
 tenant_id uuid NOT NULL, quote_id uuid NOT NULL, sequence bigint GENERATED ALWAYS AS IDENTITY,
 status varchar(16) NOT NULL, happened_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (tenant_id,quote_id,sequence),
 FOREIGN KEY (tenant_id,quote_id) REFERENCES crm_quote(tenant_id,id)
);
