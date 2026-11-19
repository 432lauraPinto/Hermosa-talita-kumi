-- =====================================================================
-- SEED DE SERVICIOS Y DATOS DEMO: HERMOSA TALITA KUMI
-- Todos los datos DEMO están identificados con es_demo = 1
-- =====================================================================

USE estetica_db;

-- Inserción de 54 tratamientos oficiales y provisionales (Módulo 09)
INSERT INTO servicios (id, categoria_id, codigo, nombre, descripcion, beneficios, duracion_minutos, precio_base, orden_visual, activo, es_demo) VALUES
-- 1. Tratamientos faciales
(1, 1, 'FAC_LIMPIEZA_BASICA', 'Limpieza facial básica', 'Higiene dérmica suave para remover impurezas superficiales del rostro.', 'Piel fresca, limpia y acondicionada.', 45, 100.00, 1, 1, 1),
(2, 1, 'FAC_LIMPIEZA_PROFUNDA', 'Limpieza facial profunda', 'Protocolo integral de higiene dérmica con vapor ozono y activos purificantes.', 'Remoción profunda de impurezas y mayor oxigenación de la piel.', 60, 150.00, 2, 1, 1),
(3, 1, 'FAC_EXTRACCION_IMPUREZAS', 'Limpieza facial con extracción de impurezas', 'Limpieza minuciosa enfocada en la descongestión de comedones y puntos negros.', 'Poros limpios y textura facial más uniforme.', 60, 160.00, 3, 1, 1),
(4, 1, 'FAC_HIDRATACION_INTENSIVA', 'Hidratación facial intensiva', 'Aplicación de sérums y mascarillas ricas en activos botánicos hidratantes.', 'Mejora la elasticidad dérmica y aporta tersura.', 50, 130.00, 4, 1, 1),
(5, 1, 'FAC_ILUMINADOR', 'Tratamiento facial iluminador', 'Tratamiento revitalizante para cutis apagado o con signos de cansancio.', 'Brillo natural y aspecto lozano en el rostro.', 50, 140.00, 5, 1, 1),
(6, 1, 'FAC_ANTIOX_VIT_C', 'Tratamiento antioxidante con vitamina C', 'Aporte cosmético antioxidante para proteger la piel frente al estrés ambiental.', 'Sensación de luminosidad y piel visiblemente revitalizada.', 50, 150.00, 6, 1, 1),
(7, 1, 'FAC_PIEL_ACNE', 'Tratamiento para piel con acné', 'Cuidado cosmético calmante y seborregulador para piel grasa o con tendencia a granitos.', 'Ayuda a equilibrar el brillo graso sin resecar la piel.', 60, 180.00, 7, 1, 1),
(8, 1, 'FAC_APARIENCIA_MANCHAS', 'Tratamiento para mejorar la apariencia de manchas', 'Protocolo cosmético unificador del tono facial mediante activos botánicos aclarantes.', 'Tono visiblemente más uniforme y piel renovada.', 60, 170.00, 8, 1, 1),
(9, 1, 'FAC_ANTIEDAD_LINEAS', 'Tratamiento antiedad y para líneas de expresión', 'Cuidado reafirmante y nutritivo para mejorar la tersura de la piel madura.', 'Piel suave, nutrida y con mayor sensación de firmeza.', 60, 190.00, 9, 1, 1),
(10, 1, 'FAC_EXFOL_PEELING', 'Exfoliación facial o peeling cosmético', 'Renovación dermo-cosmética superficial para retirar células muertas.', 'Suavidad inmediata y mejor absorción de nutrientes cosméticos.', 45, 130.00, 10, 1, 1),

-- 2. Baño de Luna
(11, 2, 'LUNA_CUERPO_COMPLETO', 'Baño de Luna cuerpo completo', 'Ritual corporal de exfoliación, nutrición y aclarado cosmético del vello y piel corporal.', 'Piel corporal extraordinariamente suave, dorada e hidratada.', 90, 220.00, 1, 1, 1),
(12, 2, 'LUNA_BRAZOS', 'Baño de Luna para brazos', 'Protocolo de luminosidad y exfoliación aplicado a la zona de los brazos.', 'Vello dorado sutilmente y piel de los brazos suave.', 40, 90.00, 2, 1, 1),
(13, 2, 'LUNA_PIERNAS', 'Baño de Luna para piernas', 'Cuidado exfoliante e iluminador para la piel de las piernas.', 'Sensación de ligereza, suavidad y brillo uniforme.', 50, 110.00, 3, 1, 1),
(14, 2, 'LUNA_ESPALDA', 'Baño de Luna para espalda', 'Limpieza profunda, exfoliación y aclarado suave de la espalda.', 'Espalda tersa, libre de asperezas e iluminada.', 45, 100.00, 4, 1, 1),
(15, 2, 'LUNA_CUELLO_ESCOTE', 'Baño de Luna para cuello y escote', 'Tratamiento dedicado a la piel delicada del cuello y escote.', 'Hidratación y textura sedosa en escote.', 35, 80.00, 5, 1, 1),
(16, 2, 'LUNA_MANOS_BRAZOS', 'Baño de Luna para manos y brazos', 'Ritual de exfoliación iluminadora desde las manos hasta los hombros.', 'Manos y brazos hidratados con tono luminoso.', 45, 95.00, 6, 1, 1),
(17, 2, 'LUNA_PIERNAS_PIES', 'Baño de Luna para piernas y pies', 'Exfoliación suavizante de piernas complementada con cuidado de pies.', 'Frescura y suavidad reconfortante en piernas y pies.', 55, 115.00, 7, 1, 1),
(18, 2, 'LUNA_EXFOL_ILUMINADORA', 'Exfoliación corporal iluminadora', 'Exfoliación corporal con gránulos botánicos y aroma revitalizante.', 'Eliminación de células muertas y textura ultra suave.', 50, 130.00, 8, 1, 1),
(19, 2, 'LUNA_HIDRAT_POST_EXFOL', 'Hidratación corporal después de la exfoliación', 'Emulsión corporal intensiva con mantecas vegetales tras la renovación celular.', 'Restauración del manto hidrolipídico y confort duradero.', 45, 120.00, 9, 1, 1),
(20, 2, 'LUNA_RITUAL_LUMINOSIDAD', 'Ritual de luminosidad corporal', 'Combinación completa de exfoliación, envoltura y crema sedosa con microreflejos dorados.', 'Piel radiante para eventos especiales o bienestar integral.', 80, 200.00, 10, 1, 1),

-- 3. Cuidado corporal
(21, 3, 'CORP_EXFOL_COMPLETA', 'Exfoliación corporal completa', 'Renovación de toda la superficie corporal con sales minerales y aceites nutritivos.', 'Suavidad global y oxigenación cutánea.', 50, 140.00, 1, 1, 1),
(22, 3, 'CORP_HIDRAT_INTENSIVA', 'Hidratación corporal intensiva', 'Tratamiento corporal profundo con crema emoliente y técnica de absorción.', 'Piel corporal protegida contra la resequedad ambiental.', 50, 130.00, 2, 1, 1),
(23, 3, 'CORP_ILUMINADOR', 'Tratamiento corporal iluminador', 'Cuidado específico para brindar lozanía y luminosidad a la piel de hombros, piernas y escote.', 'Aspecto saludable y radiante.', 60, 150.00, 3, 1, 1),
(24, 3, 'CORP_APARIENCIA_MANCHAS', 'Tratamiento cosmético para la apariencia de manchas', 'Aplicación localizada de activos botánicos para atenuar visualmente manchas corporales.', 'Tono de piel más homogéneo.', 60, 160.00, 4, 1, 1),
(25, 3, 'CORP_REAFIRMANTE', 'Tratamiento reafirmante corporal', 'Masaje reafirmante y activos tensores para mejorar la tonicidad aparente de la piel.', 'Piel con sensación de mayor firmeza y elasticidad.', 60, 170.00, 5, 1, 1),
(26, 3, 'CORP_ANTICELULITICO', 'Tratamiento anticelulítico', 'Técnicas cosméticas manuales y activos drenantes para alisar visualmente la piel con celulitis.', 'Textura dérmica más lisa y compacta.', 60, 160.00, 6, 1, 1),
(27, 3, 'CORP_REDUCTOR', 'Tratamiento reductor corporal', 'Protocolo estético manual para modelar visualmente la silueta corporal.', 'Sensación de ligereza y silueta más definida.', 60, 170.00, 7, 1, 1),
(28, 3, 'CORP_ENVOLTURA_HIDRAT', 'Envoltura corporal hidratante', 'Cura oclusiva con fangos nutritivos o geles botánicos hidratantes.', 'Nutrición intensa y relajación absoluta.', 50, 140.00, 8, 1, 1),
(29, 3, 'CORP_PIEL_SECA', 'Tratamiento para mejorar la apariencia de la piel seca', 'Cuidado específico con ceramidas y aceites ricos en ácidos grasos esenciales.', 'Alivio inmediato de la tirantez y resequedad.', 50, 130.00, 9, 1, 1),
(30, 3, 'CORP_ZONAS_ESPECIFICAS', 'Tratamiento localizado para zonas específicas del cuerpo', 'Enfoque cosmético en abdomen, glúteos o brazos según preferencia del cliente.', 'Atención focalizada en la zona deseada.', 45, 120.00, 10, 1, 1),

-- 4. Masajes corporales
(31, 4, 'MAS_RELAJANTE', 'Masaje relajante', 'Maniobras rítmicas y suaves para aliviar tensiones cotidianas y favorecer la serenidad.', 'Paz mental, descanso corporal y alivio del estrés.', 60, 160.00, 1, 1, 1),
(32, 4, 'MAS_DESCONTRACTURANTE', 'Masaje descontracturante', 'Presión moderada a firme sobre contracturas musculares de espalda y hombros.', 'Alivio de sobrecargas musculares y mayor libertad de movimiento.', 60, 180.00, 2, 1, 1),
(33, 4, 'MAS_ESPALDA_CUELLO', 'Masaje de espalda y cuello', 'Sesión concentrada en las áreas de mayor acumulación de fatiga y tensión cervical.', 'Alivio rápido de la rigidez en cuello y zona dorsal.', 40, 110.00, 3, 1, 1),
(34, 4, 'MAS_PIERNAS_PIES', 'Masaje de piernas y pies', 'Movimientos drenantes y relajantes para piernas cansadas y pies fatigados.', 'Sensación de descanso y ligereza inmediata al caminar.', 45, 100.00, 4, 1, 1),
(35, 4, 'MAS_CORPORAL_COMPLETO', 'Masaje corporal completo', 'Experiencia holística de pies a cabeza con aceites aromáticos tibios.', 'Equilibrio corporal total y relajación profunda.', 75, 200.00, 5, 1, 1),
(36, 4, 'MAS_REDUCTOR', 'Masaje reductor', 'Masaje vigoroso con maniobras rápidas en zonas localizadas para activar la microcirculación.', 'Sensación tonificante en la zona tratada.', 50, 150.00, 6, 1, 1),
(37, 4, 'MAS_ANTICELULITICO', 'Masaje anticelulítico', 'Técnica manual estimulante orientada a mejorar la apariencia externa de la piel de naranja.', 'Aspecto dérmico más homogéneo.', 50, 150.00, 7, 1, 1),
(38, 4, 'MAS_PIEDRAS_CALIENTES', 'Masaje con piedras calientes', 'Terapia geotermal con piedras volcánicas pulidas que transmiten calor a los músculos.', 'Relajación muscular profunda mediante termoterapia suave.', 75, 210.00, 8, 1, 1),
(39, 4, 'MAS_MADEROTERAPIA', 'Maderoterapia corporal', 'Técnica estética con instrumentos de madera anatómicos para masajear y modelar el cuerpo.', 'Estimulación de la piel y tonificación externa.', 60, 170.00, 9, 1, 1),
(40, 4, 'MAS_AROMATERAPIA', 'Masaje con aromaterapia', 'Masaje suave combinado con aceites esenciales naturales de lavanda, eucalipto o cítricos.', 'Bienestar sensorial, calma y reconexión interior.', 60, 170.00, 10, 1, 1),

-- 5. Depilación facial y corporal
(41, 5, 'DEP_BOZO', 'Depilación facial (bozo)', 'Depilación suave con cera cosmética tibia formulada para la piel del rostro.', 'Zona limpia y libre de vello con mínimo enrojecimiento.', 20, 40.00, 1, 1, 1),
(42, 5, 'DEP_MENTON', 'Depilación de mentón', 'Extracción suave de vello en el mentón con productos calmantes post-depilatorios.', 'Mentón suave y despejado.', 20, 40.00, 2, 1, 1),
(43, 5, 'DEP_FACIAL_COMPLETA', 'Depilación facial completa', 'Diseño integral de depilación facial que incluye bozo, mentón y patillas.', 'Cutis despejado y apto para una aplicación impecable de maquillaje.', 40, 90.00, 3, 1, 1),
(44, 5, 'DEP_AXILAS', 'Depilación de axilas', 'Depilación higiénica de axilas con aplicación de gel refrescante de aloe vera.', 'Axilas limpias y suaves.', 25, 50.00, 4, 1, 1),
(45, 5, 'DEP_BRAZOS', 'Depilación de brazos', 'Depilación dermo-suave para ambos brazos completa o media zona.', 'Brazos sedosos al tacto.', 35, 70.00, 5, 1, 1),
(46, 5, 'DEP_MEDIAS_PIERNAS', 'Depilación de medias piernas', 'Depilación de rodilla hacia abajo con cera descartable de un solo uso.', 'Piernas listas y tersas.', 35, 80.00, 6, 1, 1),
(47, 5, 'DEP_PIERNAS_COMPLETAS', 'Depilación de piernas completas', 'Servicio integral para ambas piernas con hidratación posterior calmante.', 'Suavidad completa en piernas.', 50, 130.00, 7, 1, 1),
(48, 5, 'DEP_ESPALDA', 'Depilación de espalda', 'Depilación estética de espalda para una piel limpia y libre de vello no deseado.', 'Piel de la espalda uniforme y despejada.', 40, 100.00, 8, 1, 1),

-- 6. Lifting de pestañas
(49, 6, 'LIFT_CLASICO', 'Lifting de pestañas', 'Curvatura natural de pestañas desde la raíz con productos protectores de queratina.', 'Mirada abierta y expresiva sin necesidad de rizador manual.', 45, 90.00, 1, 1, 1),
(50, 6, 'LIFT_CON_TINTE', 'Lifting con tinte', 'Curvatura de pestañas complementada con tinte negro o castaño oscuro para mayor definición.', 'Efecto de máscara de pestañas permanente y ordenado.', 55, 120.00, 2, 1, 1),
(51, 6, 'LIFT_RETOQUE', 'Retoque o mantenimiento de lifting', 'Tratamiento de nutrición intensiva para hidratar las pestañas tras semanas del lifting.', 'Pestañas nutridas, flexibles y con curvatura mantenida.', 35, 70.00, 3, 1, 1),

-- 7. Perfilado de cejas
(52, 7, 'CEJAS_DISENO_PERFILADO', 'Perfilado de cejas', 'Diseño visagista y perfilado de cejas respetando la armonía natural del rostro.', 'Cejas definidas, ordenadas y favorecedoras para tu rostro.', 30, 60.00, 1, 1, 1),
(53, 7, 'CEJAS_PERFILADO_TINTE', 'Perfilado con tinte', 'Perfilado de cejas con sombreado temporal en tinte especial para dar volumen visual.', 'Cejas con mayor definición y densidad visual.', 45, 90.00, 2, 1, 1),
(54, 7, 'CEJAS_DEPILACION_DISENO', 'Diseño y depilación de cejas', 'Limpieza y depilación minuciosa del contorno de las cejas con pinza y cera tibia.', 'Arco de cejas limpio y armónico.', 25, 50.00, 3, 1, 1)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), precio_base=VALUES(precio_base);

-- Habilitar los servicios en las 4 sucursales oficiales
INSERT INTO servicios_sucursales (servicio_id, sucursal_id, disponible)
SELECT s.id, b.id, 1
FROM servicios s
CROSS JOIN sucursales b
ON DUPLICATE KEY UPDATE disponible=1;

-- 5 Productos DEMO de venta (Módulo 19)
INSERT INTO categorias_productos (id, nombre, tipo, descripcion, activo) VALUES
(1, 'Cuidado Facial', 'facial', 'Productos destinados a la limpieza, hidratación y protección dérmica del rostro.', 1),
(2, 'Cuidado Corporal', 'corporal', 'Cremas, exfoliantes y lociones para el cuidado de la piel del cuerpo.', 1)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

INSERT INTO marcas (id, nombre, descripcion, activo) VALUES
(1, 'Talita Kumi Dermo-Care (DEMO)', 'Línea botánica demostrativa de cosmética facial y corporal', 1),
(2, 'Bio-Luz Spa (DEMO)', 'Línea de relajación y bienestar para cuidado dérmico', 1)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

INSERT INTO productos (id, categoria_id, marca_id, codigo, nombre, descripcion, tipo, funcion, instrucciones_uso, precio_publicado, es_demo, activo) VALUES
(1, 1, 1, 'PROD_LIMPIADOR_SUAVE', 'Limpiador Facial Suave', 'Espuma micelar limpiadora para retirar impurezas respetando el pH de la piel.', 'facial', 'Limpieza diaria matutina y nocturna del rostro.', 'Aplicar con movimientos circulares sobre rostro húmedo y retirar con agua templada.', 85.00, 1, 1),
(2, 1, 1, 'PROD_CREMA_HIDRAT_FAC', 'Crema Hidratante Facial Día', 'Emulsión ligera con ácido hialurónico botánico para retener la humedad natural.', 'facial', 'Hidratación y tersura continua.', 'Aplicar sobre la piel limpia cada mañana antes del protector solar.', 110.00, 1, 1),
(3, 1, 1, 'PROD_PROTECTOR_SOLAR', 'Protector Solar Dermo-Silk FPS 50+', 'Bloqueador solar facial toque seco sin residuo graso, ideal para la altura de La Paz.', 'facial', 'Protección solar diaria ante rayos UVA/UVB.', 'Aplicar generosamente 20 minutos antes de la exposición y reaplicar cada 3 horas.', 130.00, 1, 1),
(4, 2, 2, 'PROD_CREMA_CORP_NUTRI', 'Crema Nutritiva Corporal Silk Touch', 'Manteca corporal con extracto de karité para suavizar zonas resecas del cuerpo.', 'corporal', 'Nutrición dérmica corporal post-ducha.', 'Masajear suavemente por todo el cuerpo, especialmente en codos y rodillas.', 95.00, 1, 1),
(5, 2, 2, 'PROD_EXFOLIANTE_CORP', 'Exfoliante Corporal Cristales Dorados', 'Exfoliante suave con gránulos botánicos para el mantenimiento post Baño de Luna.', 'corporal', 'Renovación y tersura corporal.', 'Usar una o dos veces por semana bajo la ducha frotando con suavidad.', 105.00, 1, 1)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), precio_publicado=VALUES(precio_publicado);

-- Existencias iniciales para venta (8 unidades vendibles por producto por sucursal)
INSERT INTO existencias_sucursal (sucursal_id, producto_id, stock_venta, stock_minimo)
SELECT s.id, p.id, 8, 2
FROM sucursales s
CROSS JOIN productos p
ON DUPLICATE KEY UPDATE stock_venta=VALUES(stock_venta);

-- 2 Promociones Globales Oficiales (Módulo 12 y 19) — SIN SUCURSAL ASIGNADA
INSERT INTO promociones (id, nombre, descripcion, tipo_descuento, valor_descuento, fecha_inicio, fecha_fin, tipo_vigencia, condiciones, cupos_maximos, estado, es_demo) VALUES
(1, 'Descuento en Limpieza Facial', 'Aprovecha un 10% de descuento directo en tu sesión de Limpieza Facial Profunda.', 'porcentaje', 10.00, CURRENT_DATE(), DATE_ADD(CURRENT_DATE(), INTERVAL 45 DAY), 'fecha_reserva', 'Válido para una reserva por cliente. Aplica en cualquiera de nuestras cuatro sucursales.', 50, 'activa', 1),
(2, 'Bienestar Integral Spa', 'Bs 20 de descuento especial al agendar tu Masaje Relajante.', 'monto_fijo', 20.00, CURRENT_DATE(), DATE_ADD(CURRENT_DATE(), INTERVAL 60 DAY), 'fecha_reserva', 'Válido para todo el centro estético. No acumulable con otras promociones.', 40, 'activa', 1)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), valor_descuento=VALUES(valor_descuento);

-- Vinculación de promociones a servicios correspondientes
INSERT INTO promociones_servicios (promocion_id, servicio_id) VALUES
(1, 2), -- Limpieza facial profunda
(2, 31) -- Masaje relajante
ON DUPLICATE KEY UPDATE servicio_id=VALUES(servicio_id);
