insert into role values (1,'ADMIN');
insert into role values (2,'USER');
insert into users values (1,'alfonso@tames.com','Alfonso Tames','PBKDF2WithHmacSHA256:2048:cbUqCt2A3d22mF9351bdCaHiiGGtKhl47+hxJEwD2Go=:vY5v3ilCCnCucdsA2FRqro/3y4edPjNc8HyMMCi4QgE=','',NULL);
insert into users_role values (1,2);
insert into process values (1,47.33,'Fiber Laser Cutting');
insert into process values (2,50,'Waterjet Cutting');
insert into process values (3,21.50,'Press Brake Bending');
insert into process values (4,50,'MIG Welding');
insert into process values (5,50,'TIG Welding');
insert into process values (6,50,'Powder Coating');
insert into process values (7,2,'Handling and Packaging');
insert into material values (1,'STEEL_1018',28.5,7850,'Economical steel commonly used in construction. Cold-rolled steel is generally stronger, but more expensive, than hot-rolled material.','0.12" (11 Ga.) A1008 Steel, Cold-Rolled',.6,3,1);

