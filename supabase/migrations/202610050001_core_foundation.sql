-- SQL Editor: run this entire file once, as postgres, in a development project.
-- No demo identities, authorities, vehicles, or credentials are inserted.
begin;

create schema if not exists app;
create schema if not exists private;

create table app.tenants (
    id uuid primary key default gen_random_uuid(),
    code text not null unique check (code ~ '^[A-Z][A-Z0-9_]{1,31}$'),
    name_en text not null check (btrim(name_en) <> ''),
    name_fr text,
    country_code text not null check (country_code ~ '^[A-Z]{2}$'),
    currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
    time_zone text not null,
    status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

create table app.roles (
    code text primary key,
    label text not null,
    self_registration_allowed boolean not null default false
);

insert into app.roles (code, label, self_registration_allowed) values
    ('VERIFIER', 'Verifier', true),
    ('OWNER', 'Owner', false),
    ('BACKUP_CONTACT', 'Backup contact', false),
    ('SELLER_AGENT', 'Authorized seller', false),
    ('PRO_VERIFIER', 'Professional verifier', false),
    ('ENROLLMENT_AGENT', 'Enrollment agent', false),
    ('ENROLLMENT_ORG_ADMIN', 'Enrollment organization manager', false),
    ('LAW_ENFORCEMENT', 'Police officer', false),
    ('REGISTRY_OFFICER', 'Vehicle registry officer', false),
    ('INSURER', 'Insurer', false),
    ('TENANT_ADMIN', 'Authority administrator', false),
    ('SUPPORT', 'Support', false),
    ('AUDITOR', 'Auditor', false),
    ('PLATFORM_ADMIN', 'Platform administrator', false);

-- One global Auth identity can have one profile in each authority.
-- Auth owns credentials/phone verification; never insert into auth.users here.
create table app.users (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references app.tenants(id),
    auth_user_id uuid not null references auth.users(id) on delete restrict,
    preferred_language text not null default 'en' check (preferred_language in ('en', 'fr')),
    status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid,
    deleted_at timestamptz,
    unique (tenant_id, id),
    unique (tenant_id, auth_user_id),
    foreign key (tenant_id, created_by) references app.users(tenant_id, id)
);
create index users_auth_identity_idx on app.users(auth_user_id);

create table app.organizations (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references app.tenants(id),
    name text not null check (btrim(name) <> ''),
    type text not null check (type in ('DEALER', 'ASSOCIATION', 'INSURER', 'POLICE', 'REGISTRY', 'OTHER')),
    status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid,
    deleted_at timestamptz,
    unique (tenant_id, id),
    foreign key (tenant_id, created_by) references app.users(tenant_id, id)
);

create table app.role_assignments (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references app.tenants(id),
    user_id uuid not null,
    role_code text not null references app.roles(code),
    organization_id uuid,
    granted_by uuid,
    valid_from timestamptz not null default now(),
    valid_to timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid,
    deleted_at timestamptz,
    unique (tenant_id, id),
    check (valid_to is null or valid_to > valid_from),
    foreign key (tenant_id, user_id) references app.users(tenant_id, id),
    foreign key (tenant_id, organization_id) references app.organizations(tenant_id, id),
    foreign key (tenant_id, granted_by) references app.users(tenant_id, id),
    foreign key (tenant_id, created_by) references app.users(tenant_id, id)
);
create unique index role_assignments_open_tenant_idx
    on app.role_assignments(tenant_id, user_id, role_code)
    where organization_id is null and valid_to is null and deleted_at is null;
create unique index role_assignments_open_org_idx
    on app.role_assignments(tenant_id, user_id, role_code, organization_id)
    where organization_id is not null and valid_to is null and deleted_at is null;
create index role_assignments_org_idx on app.role_assignments(tenant_id, organization_id);

-- Identity stays separate from vehicle data. Document/PIN storage is a later migration.
create table private.owners (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references app.tenants(id),
    user_id uuid,
    kind text not null check (kind in ('PERSON', 'LEGAL_ENTITY')),
    legal_name text not null check (btrim(legal_name) <> ''),
    registration_number text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid,
    deleted_at timestamptz,
    unique (tenant_id, id),
    check (kind <> 'PERSON' or user_id is not null),
    foreign key (tenant_id, user_id) references app.users(tenant_id, id),
    foreign key (tenant_id, created_by) references app.users(tenant_id, id)
);
create unique index owners_person_user_idx on private.owners(tenant_id, user_id)
    where kind = 'PERSON' and deleted_at is null;

create table app.vehicles (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references app.tenants(id),
    chassis_identifier text not null check (btrim(chassis_identifier) <> ''),
    current_plate text check (current_plate is null or btrim(current_plate) <> ''),
    category text not null check (btrim(category) <> ''),
    make text,
    model text,
    manufacture_year smallint check (manufacture_year between 1886 and 2200),
    color text,
    sale_status text not null default 'NOT_FOR_SALE'
        check (sale_status in ('NOT_FOR_SALE', 'FOR_SALE', 'AGENT_SALE', 'REPORTED_MISSING')),
    record_status text not null default 'PENDING_REVIEW'
        check (record_status in ('PENDING_REVIEW', 'ACTIVE', 'SUSPENDED_UNPAID', 'BLOCKED', 'ARCHIVED')),
    seal_package text not null default 'NONE'
        check (seal_package in ('NONE', 'STANDARD', 'ONE_ALARM', 'FOUR_ALARMS')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid,
    deleted_at timestamptz,
    unique (tenant_id, id),
    check (deleted_at is null or record_status = 'ARCHIVED'),
    foreign key (tenant_id, created_by) references app.users(tenant_id, id)
);
-- Conservative identifier rule: trim and case-fold only, no VIN-length assumption.
-- Tombstones retain uniqueness to prevent registering the same chassis again.
create unique index vehicles_chassis_global_idx on app.vehicles(upper(btrim(chassis_identifier)));
-- Plate namespace/normalization remains D09; this is intentionally not UNIQUE yet.
create index vehicles_plate_lookup_idx on app.vehicles(upper(btrim(current_plate)));
create index vehicles_tenant_status_idx on app.vehicles(tenant_id, record_status, updated_at);

create table app.ownerships (
    id uuid primary key default gen_random_uuid(),
    tenant_id uuid not null references app.tenants(id),
    vehicle_id uuid not null,
    owner_id uuid not null,
    start_at timestamptz not null default now(),
    end_at timestamptz,
    source text not null check (btrim(source) <> ''),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid,
    deleted_at timestamptz,
    unique (tenant_id, id),
    check (end_at is null or end_at > start_at),
    foreign key (tenant_id, vehicle_id) references app.vehicles(tenant_id, id),
    foreign key (tenant_id, owner_id) references private.owners(tenant_id, id),
    foreign key (tenant_id, created_by) references app.users(tenant_id, id)
);
create unique index ownerships_one_current_idx on app.ownerships(tenant_id, vehicle_id)
    where end_at is null and deleted_at is null;
create index ownerships_owner_idx on app.ownerships(tenant_id, owner_id, end_at);

create function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create function private.validate_tenant_timezone() returns trigger
language plpgsql set search_path = '' as $$
begin
    if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.time_zone) then
        raise exception 'Unknown authority time zone' using errcode = '23514';
    end if;
    return new;
end;
$$;
create trigger tenants_valid_timezone before insert or update on app.tenants
    for each row execute function private.validate_tenant_timezone();

-- Deferred checking permits enrollment/transfer to update several rows atomically.
-- At commit, an ACTIVE vehicle must have exactly one current ownership.
create function private.check_active_vehicle_owner() returns trigger
language plpgsql set search_path = '' as $$
declare
    target_vehicle uuid;
    target_tenant uuid;
begin
    if tg_table_name = 'vehicles' then
        target_vehicle := coalesce(new.id, old.id);
        target_tenant := coalesce(new.tenant_id, old.tenant_id);
    else
        -- Moving a history row could leave its old ACTIVE vehicle ownerless.
        if tg_op = 'UPDATE' and (new.vehicle_id, new.tenant_id) is distinct from (old.vehicle_id, old.tenant_id) then
            raise exception 'Ownership vehicle and authority cannot change' using errcode = '23514';
        end if;
        target_vehicle := coalesce(new.vehicle_id, old.vehicle_id);
        target_tenant := coalesce(new.tenant_id, old.tenant_id);
    end if;
    -- Serialize ownership checks with activation/transfer of the same vehicle.
    -- A unique current-owner index alone does not prevent ownerless activation races.
    perform 1 from app.vehicles
        where tenant_id = target_tenant and id = target_vehicle for update;
    if exists (select 1 from app.vehicles
        where tenant_id = target_tenant and id = target_vehicle and record_status = 'ACTIVE' and deleted_at is null)
        and (select count(*) from app.ownerships
            where tenant_id = target_tenant and vehicle_id = target_vehicle
              and end_at is null and deleted_at is null) <> 1 then
        raise exception 'An active vehicle requires exactly one current owner' using errcode = '23514';
    end if;
    return null;
end;
$$;
create constraint trigger vehicles_require_owner
    after insert or update on app.vehicles deferrable initially deferred
    for each row execute function private.check_active_vehicle_owner();
create constraint trigger ownerships_require_owner
    after insert or update or delete on app.ownerships deferrable initially deferred
    for each row execute function private.check_active_vehicle_owner();

do $$
declare item text;
begin
    foreach item in array array['app.tenants', 'app.users', 'app.organizations',
        'app.role_assignments', 'private.owners', 'app.vehicles', 'app.ownerships'] loop
        execute format('create trigger touch_updated_at before update on %s for each row execute function private.touch_updated_at()', item);
    end loop;
end;
$$;

-- Deny client access from the moment these tables exist, before migration 002.
-- Backend runtime grants/policies will be introduced with the API, not guessed here.
do $$
declare item text;
begin
    foreach item in array array['app.tenants', 'app.roles', 'app.users', 'app.organizations',
        'app.role_assignments', 'private.owners', 'app.vehicles', 'app.ownerships'] loop
        execute format('alter table %s enable row level security', item);
        execute format('alter table %s force row level security', item);
        execute format('revoke all on table %s from public, anon, authenticated, service_role', item);
    end loop;
end;
$$;
revoke all on schema app, private from public, anon, authenticated, service_role;
revoke all on function private.touch_updated_at(), private.validate_tenant_timezone(),
    private.check_active_vehicle_owner() from public, anon, authenticated, service_role;

commit;
