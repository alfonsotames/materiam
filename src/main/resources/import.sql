insert into role values (1,'ADMIN');
insert into role values (2,'USER');
insert into users values (1,'alfonso@tames.com','Alfonso Tames','PBKDF2WithHmacSHA256:2048:cbUqCt2A3d22mF9351bdCaHiiGGtKhl47+hxJEwD2Go=:vY5v3ilCCnCucdsA2FRqro/3y4edPjNc8HyMMCi4QgE=','',NULL);
insert into users_role values (1,1);
insert into users_role values (1,2);
insert into fabprocess values (1,'Fiber Laser Cutting',400);
insert into fabprocess values (2,'Waterjet Cutting', 400);
insert into fabprocess values (3,'Press Brake Bending',300);
insert into fabprocess values (4,'MIG Welding',50);
insert into fabprocess values (5,'TIG Welding',50);
insert into fabprocess values (6,'Powder Coating',50);
insert into fabprocess values (7,'Bandsaw Cutting',50);
insert into fabprocess values (8,'Handling and Packaging',2);

insert into materialtype values (1,'FERROUS','A36 Low Alloy Steel','A36 Low Alloy Steel Cold Rolled');
insert into materialtype values (2,'NON FERROUS','Aluminum 5052-H32','Aluminum 5052-H32');
insert into materialtype values (3,'STAINLESS','Stainless Steel 304, 2B/HRAP Finish','Stainless Steel 304, 2B/HRAP Finish');



insert into materialformat values (1,'Generic','UNRECOGNIZED');
insert into materialformat values (2,'Flat Sheet Metal','SHEET_METAL_FLAT');
insert into materialformat values (3,'Folded Sheet Metal','SHEET_METAL_FOLDED');
insert into materialformat values (4,'Rectangular Tube','TUBE_RECTANGULAR');
insert into materialformat values (5,'Round Tube','TUBE_ROUND');
insert into materialformat values (6,'Bent Rectangular Tube','BENT_TUBE_RECTANGULAR');
insert into materialformat values (7,'Bent Round Tube','BENT_TUBE_ROUND');
insert into materialformat values (8,'Bent Wire','BENT_WIRE');
insert into materialformat values (9,'Wire','WIRE');
insert into materialformat values (10,'Other Tube','TUBE_OTHER');
insert into materialformat values (11,'Profile','PROFILE');




insert into material values (1,'SM_STEEL_A36_CR_28GA',7850,0,'28 Ga.',0.38,3050,'Sheet Metal Steel A36 Cold Rolled 28 Ga.',0.6,0.38,1220,1,2)
insert into material values (2,'SM_STEEL_A36_CR_26GA',7850,0,'26 Ga.',0.45,3050,'Sheet Metal Steel A36 Cold Rolled 26 Ga.',0.6,0.45,1220,1,2)
insert into material values (3,'SM_STEEL_A36_CR_24GA',7850,0,'24 Ga.',0.61,3050,'Sheet Metal Steel A36 Cold Rolled 24 Ga.',0.6,0.61,1220,1,2)
insert into material values (4,'SM_STEEL_A36_CR_22GA',7850,0,'22 Ga.',0.76,3050,'Sheet Metal Steel A36 Cold Rolled 22 Ga.',0.6,0.76,1220,1,2)
insert into material values (5,'SM_STEEL_A36_CR_20GA',7850,0,'20 Ga.',0.91,3050,'Sheet Metal Steel A36 Cold Rolled 20 Ga.',0.6,0.91,1220,1,2)
insert into material values (6,'SM_STEEL_A36_CR_18GA',7850,0,'18 Ga.',1.21,3050,'Sheet Metal Steel A36 Cold Rolled 18 Ga.',0.6,1.21,1220,1,2)
insert into material values (7,'SM_STEEL_A36_CR_16GA',7850,0,'16 Ga.',1.52,3050,'Sheet Metal Steel A36 Cold Rolled 16 Ga.',0.6,1.52,1220,1,2)
insert into material values (8,'SM_STEEL_A36_CR_14GA',7850,0,'14 Ga.',1.9,3050,'Sheet Metal Steel A36 Cold Rolled 14 Ga.',0.6,1.9,1220,1,2)
insert into material values (9,'SM_STEEL_A36_CR_12GA',7850,0,'12 Ga.',2.66,3050,'Sheet Metal Steel A36 Cold Rolled 12 Ga.',0.6,2.66,1220,1,2)
insert into material values (10,'SM_STEEL_A36_CR_11GA',7850,0,'11 Ga.',3.04,3050,'Sheet Metal Steel A36 Cold Rolled 11 Ga.',0.6,3.04,1220,1,2)
insert into material values (11,'SM_STEEL_A36_CR_10GA',7850,0,'10 Ga.',3.18,3050,'Sheet Metal Steel A36 Cold Rolled 10 Ga.',0.6,3.18,1220,1,2)
insert into material values (12,'SM_ALUM_5052_28GA',2700,0,'28 Ga.',0.356,3050,'Sheet Metal Aluminum 5052-H32 28 Ga.',3,0.356,1220,2,2)
insert into material values (13,'SM_ALUM_5052_26GA',2700,0,'26 Ga.',0.457,3050,'Sheet Metal Aluminum 5052-H32 26 Ga.',3,0.457,1220,2,2)
insert into material values (14,'SM_ALUM_5052_24GA',2700,0,'24 Ga.',0.559,3050,'Sheet Metal Aluminum 5052-H32 24 Ga.',3,0.559,1220,2,2)
insert into material values (15,'SM_ALUM_5052_22GA',2700,0,'22 Ga.',0.711,3050,'Sheet Metal Aluminum 5052-H32 22 Ga.',3,0.711,1220,2,2)
insert into material values (16,'SM_ALUM_5052_20GA',2700,0,'20 Ga.',0.889,3050,'Sheet Metal Aluminum 5052-H32 20 Ga.',3,0.889,1220,2,2)
insert into material values (17,'SM_ALUM_5052_18GA',2700,0,'18 Ga.',1.245,3050,'Sheet Metal Aluminum 5052-H32 18 Ga.',3,1.245,1220,2,2)
insert into material values (18,'SM_ALUM_5052_16GA',2700,0,'16 Ga.',1.651,3050,'Sheet Metal Aluminum 5052-H32 16 Ga.',3,1.651,1220,2,2)
insert into material values (19,'SM_ALUM_5052_14GA',2700,0,'14 Ga.',2.108,3050,'Sheet Metal Aluminum 5052-H32 14 Ga.',3,2.108,1220,2,2)
insert into material values (20,'SM_ALUM_5052_12GA',2700,0,'12 Ga.',2.769,3050,'Sheet Metal Aluminum 5052-H32 12 Ga.',3,2.769,1220,2,2)
insert into material values (21,'SM_ALUM_5052_11GA',2700,0,'11 Ga.',3.048,3050,'Sheet Metal Aluminum 5052-H32 11 Ga.',3,3.048,1220,2,2)
insert into material values (22,'SM_ALUM_5052_10GA',2700,0,'10 Ga.',3.404,3050,'Sheet Metal Aluminum 5052-H32 10 Ga.',3,3.404,1220,2,2)
insert into material values (23,'SM_SS_304_2B_28GA',8000,0,'28 Ga.',0.38,3050,'Sheet Metal Stainless Steel 304 2B 28 Ga.',1,0.38,1220,3,2)
insert into material values (24,'SM_SS_304_2B_26GA',8000,0,'26 Ga.',0.45,3050,'Sheet Metal Stainless Steel 304 2B 26 Ga.',1,0.45,1220,3,2)
insert into material values (25,'SM_SS_304_2B_24GA',8000,0,'24 Ga.',0.61,3050,'Sheet Metal Stainless Steel 304 2B 24 Ga.',1,0.61,1220,3,2)
insert into material values (26,'SM_SS_304_2B_22GA',8000,0,'22 Ga.',0.76,3050,'Sheet Metal Stainless Steel 304 2B 22 Ga.',1,0.76,1220,3,2)
insert into material values (27,'SM_SS_304_2B_20GA',8000,0,'20 Ga.',0.91,3050,'Sheet Metal Stainless Steel 304 2B 20 Ga.',1,0.91,1220,3,2)
insert into material values (28,'SM_SS_304_2B_18GA',8000,0,'18 Ga.',1.21,3050,'Sheet Metal Stainless Steel 304 2B 18 Ga.',1,1.21,1220,3,2)
insert into material values (29,'SM_SS_304_2B_16GA',8000,0,'16 Ga.',1.52,3050,'Sheet Metal Stainless Steel 304 2B 16 Ga.',1,1.52,1220,3,2)
insert into material values (30,'SM_SS_304_2B_14GA',8000,0,'14 Ga.',1.9,3050,'Sheet Metal Stainless Steel 304 2B 14 Ga.',1,1.9,1220,3,2)
insert into material values (31,'SM_SS_304_2B_12GA',8000,0,'12 Ga.',2.66,3050,'Sheet Metal Stainless Steel 304 2B 12 Ga.',1,2.66,1220,3,2)
insert into material values (32,'SM_SS_304_2B_11GA',8000,0,'11 Ga.',3.04,3050,'Sheet Metal Stainless Steel 304 2B 11 Ga.',1,3.04,1220,3,2)
insert into material values (33,'SM_SS_304_2B_10GA',8000,0,'10 Ga.',3.18,3050,'Sheet Metal Stainless Steel 304 2B 10 Ga.',1,3.18,1220,3,2)

insert into material values (34,'TR_4X4_.25_STEEL_1018',7850,0,'1/4 (3GA)',101.6,6000,'Rectangular Tube 4"x4" 1/4" 1018 Steel',.6,6.35,101.6,1,4);




insert into cuttingspeed values(1,28.5,1,1);
insert into cuttingspeed values(2,28.5,2,1);
insert into cuttingspeed values(3,28.5,3,1);
insert into cuttingspeed values(4,28.5,4,1);
insert into cuttingspeed values(5,28.5,5,1);
insert into cuttingspeed values(6,28.5,6,1);
insert into cuttingspeed values(7,28.5,7,1);
insert into cuttingspeed values(8,28.5,8,1);
insert into cuttingspeed values(9,28.5,9,1);
insert into cuttingspeed values(10,28.5,10,1);
insert into cuttingspeed values(11,28.5,11,1);
insert into cuttingspeed values(12,28.5,12,1);
insert into cuttingspeed values(13,28.5,13,1);
insert into cuttingspeed values(14,28.5,14,1);
insert into cuttingspeed values(15,28.5,15,1);
insert into cuttingspeed values(16,28.5,16,1);
insert into cuttingspeed values(17,28.5,17,1);
insert into cuttingspeed values(18,28.5,18,1);
insert into cuttingspeed values(19,28.5,19,1);
insert into cuttingspeed values(20,28.5,20,1);
insert into cuttingspeed values(21,28.5,21,1);
insert into cuttingspeed values(22,28.5,22,1);
insert into cuttingspeed values(23,28.5,23,1);
insert into cuttingspeed values(24,28.5,24,1);
insert into cuttingspeed values(25,28.5,25,1);
insert into cuttingspeed values(26,28.5,26,1);
insert into cuttingspeed values(27,28.5,27,1);
insert into cuttingspeed values(28,28.5,28,1);
insert into cuttingspeed values(29,28.5,29,1);
insert into cuttingspeed values(30,28.5,30,1);
insert into cuttingspeed values(31,28.5,31,1);
insert into cuttingspeed values(32,28.5,32,1);
insert into cuttingspeed values(33,28.5,33,1);

insert into unit values (1,'Unit','');
insert into unit values (2,'Milimeters','mm');
insert into unit values (3,'Kilogram per cubic meter','kg/m³');
insert into unit values (4,'Currency','USD');


insert into propertytype values (1,'WIDTH','Width',2);
insert into propertytype values (2,'LENGTH','Length',2);
insert into propertytype values (3,'HEIGHT','Height',2);
insert into propertytype values (4,'THICKNESS','Thickness',2);
insert into propertytype values (5,'DENSITY','Density',3);
insert into propertytype values (6,'PRICEPERKG','Price/kg',4);
insert into propertytype values (7,'DIAMETER','Diameter',2);


INSERT INTO public.product (id, name, sku, unit_id) VALUES (1, 'Sheet Metal Steel A36 Cold Rolled 28 Ga.', 'SM_STEEL_A36_CR_28GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (2, 'Sheet Metal Steel A36 Cold Rolled 26 Ga.', 'SM_STEEL_A36_CR_26GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (3, 'Sheet Metal Steel A36 Cold Rolled 24 Ga.', 'SM_STEEL_A36_CR_24GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (4, 'Sheet Metal Steel A36 Cold Rolled 22 Ga.', 'SM_STEEL_A36_CR_22GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (5, 'Sheet Metal Steel A36 Cold Rolled 20 Ga.', 'SM_STEEL_A36_CR_20GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (6, 'Sheet Metal Steel A36 Cold Rolled 18 Ga.', 'SM_STEEL_A36_CR_18GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (7, 'Sheet Metal Steel A36 Cold Rolled 16 Ga.', 'SM_STEEL_A36_CR_16GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (8, 'Sheet Metal Steel A36 Cold Rolled 14 Ga.', 'SM_STEEL_A36_CR_14GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (9, 'Sheet Metal Steel A36 Cold Rolled 12 Ga.', 'SM_STEEL_A36_CR_12GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (10, 'Sheet Metal Steel A36 Cold Rolled 11 Ga.', 'SM_STEEL_A36_CR_11GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (11, 'Sheet Metal Steel A36 Cold Rolled 10 Ga.', 'SM_STEEL_A36_CR_10GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (12, 'Sheet Metal Aluminum 5052-H32 28 Ga.', 'SM_ALUM_5052_28GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (13, 'Sheet Metal Aluminum 5052-H32 26 Ga.', 'SM_ALUM_5052_26GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (14, 'Sheet Metal Aluminum 5052-H32 24 Ga.', 'SM_ALUM_5052_24GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (15, 'Sheet Metal Aluminum 5052-H32 22 Ga.', 'SM_ALUM_5052_22GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (16, 'Sheet Metal Aluminum 5052-H32 20 Ga.', 'SM_ALUM_5052_20GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (17, 'Sheet Metal Aluminum 5052-H32 18 Ga.', 'SM_ALUM_5052_18GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (18, 'Sheet Metal Aluminum 5052-H32 16 Ga.', 'SM_ALUM_5052_16GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (19, 'Sheet Metal Aluminum 5052-H32 14 Ga.', 'SM_ALUM_5052_14GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (20, 'Sheet Metal Aluminum 5052-H32 12 Ga.', 'SM_ALUM_5052_12GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (21, 'Sheet Metal Aluminum 5052-H32 11 Ga.', 'SM_ALUM_5052_11GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (22, 'Sheet Metal Aluminum 5052-H32 10 Ga.', 'SM_ALUM_5052_10GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (23, 'Sheet Metal Stainless Steel 304 2B 28 Ga.', 'SM_SS_304_2B_28GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (24, 'Sheet Metal Stainless Steel 304 2B 26 Ga.', 'SM_SS_304_2B_26GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (25, 'Sheet Metal Stainless Steel 304 2B 24 Ga.', 'SM_SS_304_2B_24GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (26, 'Sheet Metal Stainless Steel 304 2B 22 Ga.', 'SM_SS_304_2B_22GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (27, 'Sheet Metal Stainless Steel 304 2B 20 Ga.', 'SM_SS_304_2B_20GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (28, 'Sheet Metal Stainless Steel 304 2B 18 Ga.', 'SM_SS_304_2B_18GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (29, 'Sheet Metal Stainless Steel 304 2B 16 Ga.', 'SM_SS_304_2B_16GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (30, 'Sheet Metal Stainless Steel 304 2B 14 Ga.', 'SM_SS_304_2B_14GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (31, 'Sheet Metal Stainless Steel 304 2B 12 Ga.', 'SM_SS_304_2B_12GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (32, 'Sheet Metal Stainless Steel 304 2B 11 Ga.', 'SM_SS_304_2B_11GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (33, 'Sheet Metal Stainless Steel 304 2B 10 Ga.', 'SM_SS_304_2B_10GA', 1);
INSERT INTO public.product (id, name, sku, unit_id) VALUES (34, 'Rectangular Tube 4"x 4" 1/4" A36 Steel', 'TR_4X4_.25_STEEL_A36', 1);

SELECT setval('product_id_seq', 34, true);



INSERT INTO public.category (id, key, name, parent_id) VALUES (1,  'GARS','Geometric Automatic Recognition Shape', NULL);
INSERT INTO public.category (id, key, name, parent_id) VALUES (2,  'ALLOY','Alloy', NULL);
INSERT INTO public.category (id, key, name, parent_id) VALUES (3,  'MATERIALS','Materials', NULL);
INSERT INTO public.category (id, key, name, parent_id) VALUES (4,  'UNRECOGNIZED', 'Generic', 1);
INSERT INTO public.category (id, key, name, parent_id) VALUES (5,  'SHEET_METAL_FLAT', 'Flat Sheet Metal', 1);
INSERT INTO public.category (id, key, name, parent_id) VALUES (6,  'SHEET_METAL_FOLDED', 'Folded Sheet Metal', 1);
INSERT INTO public.category (id, key, name, parent_id) VALUES (7,  'TUBE_RECTANGULAR', 'Rectangular Tube', 1);
INSERT INTO public.category (id, key, name, parent_id) VALUES (8,  'TUBE_ROUND', 'Round Tube', 1);
INSERT INTO public.category (id, key, name, parent_id) VALUES (9,  'BENT_TUBE_RECTANGULAR', 'Bent Rectangular Tube', 1);
INSERT INTO public.category (id, key, name, parent_id) VALUES (10, 'BENT_TUBE_ROUND', 'Bent Round Tube', 1);
INSERT INTO public.category (id, key, name, parent_id) VALUES (11, 'BENT_WIRE', 'Bent Wire', 1);
INSERT INTO public.category (id, key, name, parent_id) VALUES (12, 'WIRE', 'Wire', 1);
INSERT INTO public.category (id, key, name, parent_id) VALUES (13, 'TUBE_OTHER', 'Other Tube', 1);
INSERT INTO public.category (id, key, name, parent_id) VALUES (14, 'PROFILE', 'Profile', 1);
INSERT INTO public.category (id, key, name, parent_id) VALUES (15, 'RAWMATERIAL', 'Raw Material', 3);
INSERT INTO public.category (id, key, name, parent_id) VALUES (16, 'AL5052', 'Aluminium 5052', 2);
INSERT INTO public.category (id, key, name, parent_id) VALUES (17, 'A36', 'Steel A36', 2);
INSERT INTO public.category (id, key, name, parent_id) VALUES (18, 'SS304', 'Stainless Steel 304', 2);


SELECT setval('category_id_seq', 18, true);

INSERT INTO public.product_category (product_id, category_id) VALUES (1, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (2, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (3, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (4, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (5, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (6, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (7, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (8, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (9, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (10, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (11, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (12, 16);
INSERT INTO public.product_category (product_id, category_id) VALUES (13, 16);
INSERT INTO public.product_category (product_id, category_id) VALUES (14, 16);
INSERT INTO public.product_category (product_id, category_id) VALUES (15, 16);
INSERT INTO public.product_category (product_id, category_id) VALUES (16, 16);
INSERT INTO public.product_category (product_id, category_id) VALUES (17, 16);
INSERT INTO public.product_category (product_id, category_id) VALUES (18, 16);
INSERT INTO public.product_category (product_id, category_id) VALUES (19, 16);
INSERT INTO public.product_category (product_id, category_id) VALUES (20, 16);
INSERT INTO public.product_category (product_id, category_id) VALUES (21, 16);
INSERT INTO public.product_category (product_id, category_id) VALUES (22, 16);
INSERT INTO public.product_category (product_id, category_id) VALUES (23, 18);
INSERT INTO public.product_category (product_id, category_id) VALUES (24, 18);
INSERT INTO public.product_category (product_id, category_id) VALUES (25, 18);
INSERT INTO public.product_category (product_id, category_id) VALUES (26, 18);
INSERT INTO public.product_category (product_id, category_id) VALUES (27, 18);
INSERT INTO public.product_category (product_id, category_id) VALUES (28, 18);
INSERT INTO public.product_category (product_id, category_id) VALUES (29, 18);
INSERT INTO public.product_category (product_id, category_id) VALUES (30, 18);
INSERT INTO public.product_category (product_id, category_id) VALUES (31, 18);
INSERT INTO public.product_category (product_id, category_id) VALUES (32, 18);
INSERT INTO public.product_category (product_id, category_id) VALUES (33, 18);
INSERT INTO public.product_category (product_id, category_id) VALUES (34, 17);
INSERT INTO public.product_category (product_id, category_id) VALUES (1, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (2, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (3, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (4, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (5, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (6, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (7, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (8, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (9, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (10, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (11, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (12, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (13, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (14, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (15, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (16, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (17, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (18, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (19, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (20, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (21, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (22, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (23, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (24, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (25, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (26, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (27, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (28, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (29, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (30, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (31, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (32, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (33, 5);
INSERT INTO public.product_category (product_id, category_id) VALUES (34, 7);







INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (1, NULL, 3050.000, 1, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (2, NULL, 3050.000, 2, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (3, NULL, 3050.000, 3, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (4, NULL, 3050.000, 4, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (5, NULL, 3050.000, 5, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (6, NULL, 3050.000, 6, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (7, NULL, 3050.000, 7, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (8, NULL, 3050.000, 8, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (9, NULL, 3050.000, 9, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (10, NULL, 3050.000, 10, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (11, NULL, 3050.000, 11, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (12, NULL, 3050.000, 12, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (13, NULL, 3050.000, 13, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (14, NULL, 3050.000, 14, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (15, NULL, 3050.000, 15, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (16, NULL, 3050.000, 16, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (17, NULL, 3050.000, 17, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (18, NULL, 3050.000, 18, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (19, NULL, 3050.000, 19, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (20, NULL, 3050.000, 20, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (21, NULL, 3050.000, 21, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (22, NULL, 3050.000, 22, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (23, NULL, 3050.000, 23, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (24, NULL, 3050.000, 24, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (25, NULL, 3050.000, 25, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (26, NULL, 3050.000, 26, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (27, NULL, 3050.000, 27, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (28, NULL, 3050.000, 28, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (29, NULL, 3050.000, 29, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (30, NULL, 3050.000, 30, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (31, NULL, 3050.000, 31, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (32, NULL, 3050.000, 32, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (33, NULL, 3050.000, 33, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (34, NULL, 1220.000, 1, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (35, NULL, 1220.000, 2, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (36, NULL, 1220.000, 3, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (37, NULL, 1220.000, 4, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (38, NULL, 1220.000, 5, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (39, NULL, 1220.000, 6, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (40, NULL, 1220.000, 7, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (41, NULL, 1220.000, 8, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (42, NULL, 1220.000, 9, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (43, NULL, 1220.000, 10, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (44, NULL, 1220.000, 11, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (45, NULL, 1220.000, 12, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (46, NULL, 1220.000, 13, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (47, NULL, 1220.000, 14, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (48, NULL, 1220.000, 15, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (49, NULL, 1220.000, 16, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (50, NULL, 1220.000, 17, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (51, NULL, 1220.000, 18, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (52, NULL, 1220.000, 19, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (53, NULL, 1220.000, 20, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (54, NULL, 1220.000, 21, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (55, NULL, 1220.000, 22, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (56, NULL, 1220.000, 23, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (57, NULL, 1220.000, 24, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (58, NULL, 1220.000, 25, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (59, NULL, 1220.000, 26, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (60, NULL, 1220.000, 27, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (61, NULL, 1220.000, 28, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (62, NULL, 1220.000, 29, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (63, NULL, 1220.000, 30, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (64, NULL, 1220.000, 31, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (65, NULL, 1220.000, 32, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (66, NULL, 1220.000, 33, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (67, NULL, 0.380, 1, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (68, NULL, 0.450, 2, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (69, NULL, 0.610, 3, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (70, NULL, 0.760, 4, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (71, NULL, 0.910, 5, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (72, NULL, 1.210, 6, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (73, NULL, 1.520, 7, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (74, NULL, 1.900, 8, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (75, NULL, 2.660, 9, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (76, NULL, 3.040, 10, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (77, NULL, 3.180, 11, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (78, NULL, 0.360, 12, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (79, NULL, 0.460, 13, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (80, NULL, 0.560, 14, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (81, NULL, 0.710, 15, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (82, NULL, 0.890, 16, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (83, NULL, 1.250, 17, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (84, NULL, 1.650, 18, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (85, NULL, 2.110, 19, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (86, NULL, 2.770, 20, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (87, NULL, 3.050, 21, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (88, NULL, 3.400, 22, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (89, NULL, 0.380, 23, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (90, NULL, 0.450, 24, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (91, NULL, 0.610, 25, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (92, NULL, 0.760, 26, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (93, NULL, 0.910, 27, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (94, NULL, 1.210, 28, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (95, NULL, 1.520, 29, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (96, NULL, 1.900, 30, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (97, NULL, 2.660, 31, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (98, NULL, 3.040, 32, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (99, NULL, 3.180, 33, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (101, NULL, 7850.000, 1, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (102, NULL, 7850.000, 2, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (103, NULL, 7850.000, 3, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (104, NULL, 7850.000, 4, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (105, NULL, 7850.000, 5, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (106, NULL, 7850.000, 6, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (107, NULL, 7850.000, 7, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (108, NULL, 7850.000, 8, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (109, NULL, 7850.000, 9, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (110, NULL, 7850.000, 10, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (111, NULL, 7850.000, 11, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (112, NULL, 2700.000, 12, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (113, NULL, 2700.000, 13, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (114, NULL, 2700.000, 14, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (115, NULL, 2700.000, 15, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (116, NULL, 2700.000, 16, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (117, NULL, 2700.000, 17, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (118, NULL, 2700.000, 18, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (119, NULL, 2700.000, 19, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (120, NULL, 2700.000, 20, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (121, NULL, 2700.000, 21, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (122, NULL, 2700.000, 22, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (123, NULL, 8000.000, 23, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (124, NULL, 8000.000, 24, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (125, NULL, 8000.000, 25, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (126, NULL, 8000.000, 26, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (127, NULL, 8000.000, 27, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (128, NULL, 8000.000, 28, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (129, NULL, 8000.000, 29, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (130, NULL, 8000.000, 30, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (131, NULL, 8000.000, 31, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (132, NULL, 8000.000, 32, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (133, NULL, 8000.000, 33, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (134, NULL, 0.000, 1, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (135, NULL, 0.000, 2, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (136, NULL, 0.000, 3, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (137, NULL, 0.000, 4, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (138, NULL, 0.000, 5, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (139, NULL, 0.000, 6, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (140, NULL, 0.000, 7, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (141, NULL, 0.000, 8, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (142, NULL, 0.000, 9, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (143, NULL, 0.000, 10, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (144, NULL, 0.000, 11, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (145, NULL, 0.000, 12, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (146, NULL, 0.000, 13, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (147, NULL, 0.000, 14, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (148, NULL, 0.000, 15, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (149, NULL, 0.000, 16, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (150, NULL, 0.000, 17, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (151, NULL, 0.000, 18, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (152, NULL, 0.000, 19, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (153, NULL, 0.000, 20, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (154, NULL, 0.000, 21, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (155, NULL, 0.000, 22, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (156, NULL, 0.000, 23, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (157, NULL, 0.000, 24, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (158, NULL, 0.000, 25, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (159, NULL, 0.000, 26, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (160, NULL, 0.000, 27, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (161, NULL, 0.000, 28, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (162, NULL, 0.000, 29, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (163, NULL, 0.000, 30, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (164, NULL, 0.000, 31, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (165, NULL, 0.000, 32, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (166, NULL, 0.000, 33, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (202, NULL, 0.000, 1, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (203, NULL, 0.000, 2, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (204, NULL, 0.000, 3, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (205, NULL, 0.000, 4, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (206, NULL, 0.000, 5, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (207, NULL, 0.000, 6, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (208, NULL, 0.000, 7, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (209, NULL, 0.000, 8, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (210, NULL, 0.000, 9, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (211, NULL, 0.000, 10, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (212, NULL, 0.000, 11, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (213, NULL, 0.000, 12, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (214, NULL, 0.000, 13, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (215, NULL, 0.000, 14, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (216, NULL, 0.000, 15, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (217, NULL, 0.000, 16, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (218, NULL, 0.000, 17, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (219, NULL, 0.000, 18, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (220, NULL, 0.000, 19, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (221, NULL, 0.000, 20, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (222, NULL, 0.000, 21, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (223, NULL, 0.000, 22, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (224, NULL, 0.000, 23, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (225, NULL, 0.000, 24, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (226, NULL, 0.000, 25, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (227, NULL, 0.000, 26, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (228, NULL, 0.000, 27, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (229, NULL, 0.000, 28, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (230, NULL, 0.000, 29, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (231, NULL, 0.000, 30, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (232, NULL, 0.000, 31, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (233, NULL, 0.000, 32, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (234, NULL, 0.000, 33, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (235, NULL, 0.000, 34, 7);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (236, NULL, 101.600, 34, 1);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (237, NULL, 101.600, 34, 2);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (167, NULL, 101.600, 34, 3);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (239, NULL, 7850.000, 34, 5);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (240, NULL, 6.350, 34, 4);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (189, NULL, 6.500, 22, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (188, NULL, 6.500, 21, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (187, NULL, 6.500, 20, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (186, NULL, 6.500, 19, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (185, NULL, 6.500, 18, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (184, NULL, 6.500, 17, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (183, NULL, 6.500, 16, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (182, NULL, 6.500, 15, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (181, NULL, 6.500, 14, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (180, NULL, 6.500, 13, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (179, NULL, 6.500, 12, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (200, NULL, 4.600, 33, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (199, NULL, 4.600, 32, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (198, NULL, 4.600, 31, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (197, NULL, 4.600, 30, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (196, NULL, 4.600, 29, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (195, NULL, 4.600, 28, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (194, NULL, 4.600, 27, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (193, NULL, 4.600, 26, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (192, NULL, 4.600, 25, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (191, NULL, 4.600, 24, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (190, NULL, 4.600, 23, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (177, NULL, 0.720, 10, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (201, NULL, 0.720, 34, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (178, NULL, 0.720, 11, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (176, NULL, 0.720, 9, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (175, NULL, 0.720, 8, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (174, NULL, 0.720, 7, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (173, NULL, 0.720, 6, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (172, NULL, 0.720, 5, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (171, NULL, 0.720, 4, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (170, NULL, 0.720, 3, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (169, NULL, 0.720, 2, 6);
INSERT INTO public.property (id, textvalue, value, product_id, propertytype_id) VALUES (168, NULL, 0.720, 1, 6);


SELECT setval('property_id_seq', 240, true);