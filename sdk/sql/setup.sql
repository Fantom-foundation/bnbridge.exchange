




drop table if exists eth_accounts;
create table eth_accounts (
  uuid char(36) primary key,
  private_key varchar(64),
  public_key varchar(64),
  created timestamp,
);


drop table if exists bnb_accounts;
create table bnb_accounts (
  uuid char(36) primary key,
  private_key varchar(64),
  public_key varchar(64),
  created timestamp,
);


drop table if exists tokens;
create table tokens (
  uuid char(36) primary key,
  name varchar(64),
  symbol varchar(10),
  total_supply bigint,
  eth_account_uuid char(36),
  bnb_account_uuid char(36),
  created timestamp,
);


drop table if exists swap;
create table swap (
  uuid char(36) primary key,
  token_uuid char(36),
  eth_address varchar(64),
  bnb_address varchar(64),
  funded boolean,
  processed boolean,
  created timestamp,
);
