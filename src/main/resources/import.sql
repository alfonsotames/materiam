insert into role values (1,'ADMIN');
insert into role values (2,'USER');
insert into users values (1,'alfonso@tames.com','Alfonso Tames','PBKDF2WithHmacSHA256:2048:cbUqCt2A3d22mF9351bdCaHiiGGtKhl47+hxJEwD2Go=:vY5v3ilCCnCucdsA2FRqro/3y4edPjNc8HyMMCi4QgE=','',NULL);
insert into users_role values (1,2);
insert into process values (1,'Fiber Laser Cutting',47.33);
insert into process values (2,'Waterjet Cutting', 50);
insert into process values (3,'Press Brake Bending',21.50);
insert into process values (4,'MIG Welding',50);
insert into process values (5,'TIG Welding',50);
insert into process values (6,'Powder Coating',50);
insert into process values (7,'Handling and Packaging',2);
insert into material values (1,'STEEL_1018',7850,'Economical steel commonly used in construction. Cold-rolled steel is generally stronger, but more expensive, than hot-rolled material.',28.5,'0.12" (11 Ga.) A1008 Steel, Cold-Rolled',.6,3,35);

