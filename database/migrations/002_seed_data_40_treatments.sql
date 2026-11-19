-- =====================================================================
-- MIGRACIÓN 002: SEMILLAS DE 40 TRATAMIENTOS, PRODUCTOS E INVENTARIO
-- Centro Estético Cristiano Hermosa Talita Kumi
-- =====================================================================

-- 1. CATEGORÍAS
INSERT IGNORE INTO service_categories (id, code, name, description, image) VALUES
(1, 'FACIAL', 'Tratamientos Faciales', 'Cuidado dérmico profesional para higiene, hidratación, revitalización y equilibrio cutáneo.', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'),
(2, 'LUNA', 'Baño de Luna', 'Ritual cosmético exfoliante, suavizante y aclarante del vello para cuerpo completo y zonas específicas.', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),
(3, 'CORPORAL', 'Cuidado Corporal', 'Tratamientos dérmicos reafirmantes, hidratantes y de bienestar para cada zona corporal.', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),
(4, 'MASAJE', 'Masajes', 'Terapias de relajación, alivio de tensión muscular y armonización de cuerpo y espíritu.', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600');

-- 2. LOS 10 TRATAMIENTOS FACIALES (IDs 1 al 10)
INSERT IGNORE INTO services (id, category_code, name, description, benefits, price, duration, type, status, image) VALUES
(1, 'FACIAL', 'Limpieza facial profunda', 
 'Higiene dérmica con vapor de ozono, desincrustación con espátula ultrasónica, extracción cuidadosa de impurezas y alta frecuencia descongestiva.', 
 'Poros descongestionados, textura dérmica suave y balance del manto hidrolipídico.', 180.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'),

(2, 'FACIAL', 'Hidratación facial', 
 'Protocolo intensivo con ácido hialurónico multimolecular, mascarilla hidroplástica y suero botánico calmante.', 
 'Aporte hídrico inmediato, flexibilidad cutánea y disminución de la tirantez.', 160.00, 50, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600'),

(3, 'FACIAL', 'Exfoliación facial', 
 'Microexfoliación enzimática suave para renovar células queratinizadas sin agredir pieles sensibles.', 
 'Tono homogéneo, mayor absorción de principios activos y luminosidad natural.', 140.00, 45, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600'),

(4, 'FACIAL', 'Tratamiento iluminador facial', 
 'Infusión cosmética con Vitamina C estabilizada y complejo antioxidante vegetal.', 
 'Rostro luminoso, revitalizado y con aspecto fresco y descansado.', 210.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'),

(5, 'FACIAL', 'Tratamiento cosmético para mejorar la apariencia de manchas', 
 'Protocolo cosmecéutico despigmentante con niacinamida, ácido fítico y extracto de regaliz.', 
 'Atenuación cosmética del tono irregular y mejora progresiva de la uniformidad dérmica.', 240.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600'),

(6, 'FACIAL', 'Tratamiento facial antiarrugas', 
 'Cuidado enriquecido con péptidos tensores, colágeno hidrolizado y masaje facial reafirmante.', 
 'Disminución óptica de líneas de expresión y aspecto visiblemente más descansado.', 260.00, 75, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600'),

(7, 'FACIAL', 'Tratamiento reafirmante facial', 
 'Electroestimulación dérmica suave combinada con velo reafirmante de elastina y suero tensor.', 
 'Sensación de mayor firmeza, tonificación en óvalo facial y soporte cutáneo.', 230.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),

(8, 'FACIAL', 'Tratamiento facial calmante', 
 'Especial para pieles reactivas o con rojeces leves con extracto de caléndula, manzanilla y centella asiática.', 
 'Alivio dérmico inmediato, disminución de rojeces y recuperación de la sensación de bienestar.', 170.00, 50, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600'),

(9, 'FACIAL', 'Tratamiento facial para piel grasa', 
 'Purificación sebácea con arcilla volcánica verde, ácido salicílico cosmético y loción astringente no alcohólica.', 
 'Efecto mate prolongado, reducción de brillo en zona T y control suave del sebo.', 190.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600'),

(10, 'FACIAL', 'Tratamiento facial revitalizante', 
 'Complejo multivitamínico (A, C, E) con masaje neurosedante facial y ampolla revitalizante.', 
 'Piel tersa, vitalizada y con brillo saludable tras jornadas de estrés o desvelo.', 220.00, 60, 'FACIAL', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600');

-- 3. LAS 10 MODALIDADES DE BAÑO DE LUNA (IDs 11 al 20)
INSERT IGNORE INTO services (id, category_code, name, description, benefits, price, duration, type, status, image) VALUES
(11, 'LUNA', 'Baño de Luna cuerpo completo', 
 'Ritual integral de decoloración suave del vello corporal, exfoliación nutritiva y masaje final con crema hidratante satinada.', 
 'Vellosidades doradas y discretas, piel aterciopelada y suavidad en todo el cuerpo.', 280.00, 90, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),

(12, 'LUNA', 'Baño de Luna para brazos y piernas', 
 'Aplicación cosmética para dorar el vello en extremidades con exfoliante frutal y humectación profunda.', 
 'Brazos y piernas luminosos con vello dorado uniforme y tacto sedoso.', 200.00, 60, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),

(13, 'LUNA', 'Baño de Luna para brazos', 
 'Tratamiento focalizado en brazos desde hombros hasta muñecas con aclarado suave de vello.', 
 'Brazos con vello dorado sutil y piel perfectamente hidratada.', 120.00, 40, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600'),

(14, 'LUNA', 'Baño de Luna para piernas', 
 'Decoloración cosmética de vello en piernas completas, exfoliación con sales y loción refrescante.', 
 'Piernas bronceadas visualmente con vello disimulado y textura tersa.', 150.00, 45, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),

(15, 'LUNA', 'Baño de Luna para espalda', 
 'Higiene dérmica suave, decoloración estética del vello de la espalda y nutrición dérmica.', 
 'Espalda uniforme, vellos dorados y sensación de frescura.', 140.00, 45, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600'),

(16, 'LUNA', 'Baño de Luna para cuello y escote', 
 'Aclarado cosmético de vello fino en escote y cuello con emulsión altamente emoliente.', 
 'Escote uniforme, vello disimulado y suavidad para prendas abiertas.', 110.00, 35, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'),

(17, 'LUNA', 'Baño de Luna facial', 
 'Decoloración delicada del vello fino facial (bozo y patillas) con crema dermoprotectora de baja irritabilidad.', 
 'Rostro iluminado sin vellos oscuros visibles y acabado suave al tacto.', 130.00, 40, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'),

(18, 'LUNA', 'Baño de Luna para espalda y brazos', 
 'Combinación de zonas superiores con exfoliación de azúcar moreno y aclarado cosmético.', 
 'Torso superior y extremidades con aspecto homogéneo y dorado.', 180.00, 50, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600'),

(19, 'LUNA', 'Baño de Luna para brazos y piernas completas', 
 'Tratamiento intensivo en extremidades completas con baño exfoliante y masaje aromático.', 
 'Vellosidades doradas armoniosas y suavidad prolongada.', 220.00, 70, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),

(20, 'LUNA', 'Baño de Luna personalizado por zonas', 
 'Sesión adaptada a la combinación de áreas seleccionada por la clienta según su necesidad.', 
 'Atención focalizada en las áreas deseadas con productos dermocompatibles.', 250.00, 75, 'LUNA', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600');

-- 4. LOS 10 TRATAMIENTOS DE CUIDADO CORPORAL (IDs 21 al 30)
INSERT IGNORE INTO services (id, category_code, name, description, benefits, price, duration, type, status, image) VALUES
(21, 'CORPORAL', 'Exfoliación corporal', 
 'Renovación de células córneas de todo el cuerpo con sales marinas y aceites esenciales de almendras dulces.', 
 'Tacto aterciopelado, preparación de la piel para hidratación y eliminación de rugosidades.', 170.00, 50, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600'),

(22, 'CORPORAL', 'Hidratación corporal profunda', 
 'Envoltura corporal nutritiva con manteca de karité, ceramidas y masaje envolvente de penetración.', 
 'Nutrición dérmica prolongada, alivio de la resequedad y elasticidad cutánea.', 190.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),

(23, 'CORPORAL', 'Tratamiento corporal iluminador', 
 'Exfoliación suave seguida de mascarilla corporal nacarada con micropartículas reflectoras y vitamina C.', 
 'Piel con brillo satinado, aspecto saludable y sedosidad.', 220.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),

(24, 'CORPORAL', 'Tratamiento cosmético para mejorar la apariencia de manchas corporales', 
 'Aplicación cosmecéutica en zonas con fricción (axilas, codos, entrepierna) con agentes despigmentantes botánicos.', 
 'Atenuación cosmética del oscurecimiento por roce y mejora del tono dérmico.', 250.00, 70, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600'),

(25, 'CORPORAL', 'Tratamiento reafirmante corporal', 
 'Sesión con activos botánicos tensores de centella asiática, cafeína y masajes de activación fibroblástica.', 
 'Sensación de mayor tensión cutánea, mejora visual de la textura de naranja y tonicidad.', 230.00, 60, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),

(26, 'CORPORAL', 'Hidratación de manos y brazos', 
 'Spa de manos con exfoliante suave, mascarilla emoliente térmica y masaje hasta codos.', 
 'Manos suaves, cutículas hidratadas y alivio de la resequedad por clima o químicos.', 120.00, 40, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600'),

(27, 'CORPORAL', 'Hidratación de piernas y pies', 
 'Baño de sales aromáticas, remoción de asperezas en talones y masaje ultra hidratante.', 
 'Alivio de pesadez en piernas, talones suaves y frescura reconfortante.', 130.00, 45, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600'),

(28, 'CORPORAL', 'Cuidado cosmético para zonas resecas', 
 'Focalizado en codos, rodillas y zonas agrietadas con ungüento de caléndula, urea al 10% y cera de abeja.', 
 'Suavizado intensivo de durezas y restauración de la barrera cutánea.', 140.00, 45, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600'),

(29, 'CORPORAL', 'Tratamiento corporal personalizado', 
 'Evaluación previa y combinación de técnicas de exfoliación, aparatología estética suave y mascarilla específica.', 
 'Respuesta adaptada a los objetivos particulares de cada clienta.', 240.00, 75, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'),

(30, 'CORPORAL', 'Ritual corporal de cuidado y bienestar', 
 'Experiencia completa de exfoliación aromática, envoltura nutritiva y masaje relajante corporal de cierre.', 
 'Desconexión total, piel rejuvenecida y descanso integral en mente y cuerpo.', 290.00, 90, 'CORPORAL', 'ACTIVO', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600');

-- 5. LAS 10 MODALIDADES DE MASAJES (IDs 31 al 40)
INSERT IGNORE INTO services (id, category_code, name, description, benefits, price, duration, type, status, image) VALUES
(31, 'MASAJE', 'Masaje relajante', 
 'Maniobras rítmicas suaves y continuas con aceites esenciales de lavanda y música ambiental pacífica.', 
 'Alivio de la tensión nerviosa, desconexión del estrés cotidiano y armonización general.', 180.00, 60, 'MASAJE', 'ACTIVO', 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600'),

(32, 'MASAJE', 'Masaje de espalda y hombros', 
 'Presión descontracturante moderada focalizada en trapecios, romboides y zona lumbar.', 
 'Alivio notable de contracturas por mala postura o jornadas laborales prolongadas.', 130.00, 40, 'MASAJE', 'ACTIVO', 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600'),

(33, 'MASAJE', 'Masaje de cuello y hombros', 
 'Técnicas de tracción suave y digitopresión en cuello, cervicales y base del cráneo.', 
 'Disminución de cefaleas tensionales y sensación de liviandad en hombros.', 110.00, 35, 'MASAJE', 'ACTIVO', 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600'),

(34, 'MASAJE', 'Masaje de piernas', 
 'Bombeo ascendente y pases sedantes para descongestionar retorno venoso y muscular.', 
 'Alivio inmediato de pesadez y reactivación de la circulación periférica.', 130.00, 40, 'MASAJE', 'ACTIVO', 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=600'),

(35, 'MASAJE', 'Masaje de pies', 
 'Presiones reflexológicas placenteras en plantas y arcos plantares con crema mentolada.', 
 'Relajación profunda en pies cansados y sensación de renovación corporal.', 100.00, 30, 'MASAJE', 'ACTIVO', 'https://images.unsplash.com/photo-1512290900672-1f41b4e2f9d6?w=600'),

(36, 'MASAJE', 'Masaje corporal completo', 
 'Recorrido armónico desde los pies hasta el cuello alternando roces profundos y amasamientos lentos.', 
 'Relajación muscular integral, liberación de endorfinas y equilibrio corporal.', 240.00, 75, 'MASAJE', 'ACTIVO', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600'),

(37, 'MASAJE', 'Masaje de manos y brazos', 
 'Maniobras sedantes en palmas, antebrazos y brazos para aliviar tensión acumulada por teclado o celular.', 
 'Descanso articular en dedos y muñecas y sensación de relajación.', 110.00, 35, 'MASAJE', 'ACTIVO', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600'),

(38, 'MASAJE', 'Masaje relajante personalizado', 
 'Adaptación de presión y aceites aromáticos según la preferencia puntual de la clienta.', 
 'Atención a medida en los puntos corporales que requieran mayor relajación.', 220.00, 60, 'MASAJE', 'ACTIVO', 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600'),

(39, 'MASAJE', 'Masaje de bienestar corporal', 
 'Combinación de termoterapia ligera con toallas cálidas y masaje rítmico integral.', 
 'Sensación reconfortante de calor, confort muscular y alivio de tensiones.', 200.00, 60, 'MASAJE', 'ACTIVO', 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600'),

(40, 'MASAJE', 'Ritual de relajación', 
 'Tratamiento exclusivo con aromaterapia cristiana, velo tibio, piedras suaves y masaje integral.', 
 'Paz profunda en espíritu y cuerpo, descanso supremo y renovación energética.', 280.00, 90, 'MASAJE', 'ACTIVO', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600');

-- 6. ASIGNACIÓN DE LOS 40 TRATAMIENTOS A LAS 3 SUCURSALES (Sopocachi, Calacoto, Cochabamba)
-- Sucursal 1 (La Paz Sopocachi): todos los 40 tratamientos
-- Sucursal 2 (La Paz Calacoto): todos los 40 tratamientos
-- Sucursal 3 (Cochabamba América): todos los 40 tratamientos
INSERT IGNORE INTO branch_services (branch_id, service_id, active)
SELECT b.id, s.id, 1 FROM branches b CROSS JOIN services s;

-- 7. CATÁLOGO DE PRODUCTOS COSMÉTICOS
INSERT IGNORE INTO beauty_products (id, name, brand, category, description, function_desc, type, related_treatment, usage_instructions, frequency, unit, price, image, status) VALUES
(1, 'Sérum Ácido Hialurónico Puro 2% + B5', 'Talita Kumi Dermo', 'Hidratación Facial', 
 'Concentrado hialurónico multimolecular de penetración dérmica.', 
 'Restaurar volumen, atenuar líneas de tirantez y fijar hidratación.', 'FACIAL', 
 'Hidratación facial', 'Aplicar 4 gotas sobre rostro limpio mañana y noche.', 'Diario (Mañana y Noche)', 'Frasco 30ml', 140.00, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', 'ACTIVO'),

(2, 'Protector Solar FPS 50+ Toque Seco Mineral', 'Dermashield Pro', 'Fotoprotección', 
 'Protector solar con filtros minerales, sin fragancia y acabado mate.', 
 'Proteger contra rayos UVA/UVB y prevenir pigmentación dérmica.', 'FACIAL', 
 'Tratamiento cosmético para mejorar la apariencia de manchas', 'Aplicar 15 min antes del sol y reaplicar cada 3 horas.', 'Cada 3-4 horas', 'Tubo 50ml', 150.00, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 'ACTIVO'),

(3, 'Crema Regeneradora Calmante Cera-Repair', 'Talita Kumi Care', 'Nutrición Facial', 
 'Complejo de tres ceramidas idénticas a la piel y niacinamida calmante.', 
 'Fortalecer barrera dérmica y aliviar enrojecimientos.', 'FACIAL', 
 'Tratamiento facial calmante', 'Aplicar sobre rostro y cuello en la noche.', 'Noche antes de dormir', 'Tarro 50g', 135.00, 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400', 'ACTIVO'),

(4, 'Gel Exfoliante Botánico con Microesferas de Bambú', 'Pure Botanical', 'Exfoliación', 
 'Exfoliante no abrasivo con partículas biodegradables de bambú y té verde.', 
 'Remover impurezas superficiales y desincrustar poros.', 'FACIAL', 
 'Exfoliación facial', 'Masajear suavemente 1 minuto sobre piel húmeda.', '1 a 2 veces por semana', 'Tubo 100ml', 110.00, 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400', 'ACTIVO'),

(5, 'Loción Purificante Seborreguladora con Árbol de Té', 'Clarity Skin', 'Limpieza Facial', 
 'Tónico equilibrante con extracto de melaleuca y zinc PCA.', 
 'Matificar, purificar poros y controlar brillo.', 'FACIAL', 
 'Tratamiento facial para piel grasa', 'Extender con disco de algodón mañana y noche.', '2 veces al día', 'Frasco 150ml', 95.00, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400', 'ACTIVO'),

(6, 'Crema Decolorante Cosmética Suave Baño de Luna', 'Lumina Gold', 'Baño de Luna', 
 'Crema decolorante con agentes protectores de manzanilla para vello corporal.', 
 'Aclarar suavemente el vello sin maltratar la piel.', 'CORPORAL', 
 'Baño de Luna cuerpo completo', 'Aplicar con brocha según protocolo en cabina.', 'Uso en cabina', 'Pote 250g', 120.00, 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400', 'ACTIVO'),

(7, 'Exfoliante Corporal de Sales del Mar Muerto & Almendras', 'Velvety Skin', 'Exfoliación Corporal', 
 'Sales minerales aromáticas prensadas con aceite de almendras dulces.', 
 'Remover células muertas y otorgar suavidad sedosa.', 'CORPORAL', 
 'Exfoliación corporal', 'Masajear en ducha circularmente de abajo hacia arriba.', '1 vez por semana', 'Pote 300g', 130.00, 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400', 'ACTIVO'),

(8, 'Manteca Corporal Nutritiva de Karité Puro', 'Naturaleza Divina', 'Hidratación Corporal', 
 'Manteca pura de karité batida con aceite de argán.', 
 'Nutrición extrema para zonas resecas y codos.', 'CORPORAL', 
 'Cuidado cosmético para zonas resecas', 'Aplicar dando un ligero masaje hasta absorber.', 'Diario tras el baño', 'Tarro 200g', 125.00, 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400', 'ACTIVO'),

(9, 'Aceite Esencial Masaje Relajante Lavanda & Manzanilla', 'Paz & Armonía', 'Aromaterapia', 
 'Aceite para masaje corporal con aromaterapia relajante y grado cosmético.', 
 'Facilitar el deslizamiento del masaje y promover relajación.', 'CORPORAL', 
 'Masaje relajante', 'Uso por terapeutas en cabina.', 'Uso profesional', 'Frasco 250ml', 115.00, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400', 'ACTIVO'),

(10, 'Gel Criogénico Reafirmante con Centella Asiática', 'Silhouette Pro', 'Reafirmante', 
 'Gel de efecto frío tonificante con extractos descongestivos.', 
 'Aportar firmeza cutánea y frescura a piernas y abdomen.', 'CORPORAL', 
 'Tratamiento reafirmante corporal', 'Aplicar con masajes ascendentes después de la ducha.', 'Diario por las mañanas', 'Pomo 200ml', 145.00, 'https://images.unsplash.com/photo-1608248597359-00e9ec02bc56?w=400', 'ACTIVO');

-- 8. INVENTARIO INICIAL POR SUCURSAL
-- Sede 1: Sopocachi
INSERT IGNORE INTO branch_inventory (branch_id, product_id, stock_quantity, min_stock_alert) VALUES
(1, 1, 18, 5), (1, 2, 24, 6), (1, 3, 15, 4), (1, 4, 12, 3), (1, 5, 20, 5),
(1, 6, 30, 8), (1, 7, 22, 5), (1, 8, 14, 4), (1, 9, 25, 5), (1, 10, 16, 4);

-- Sede 2: Calacoto
INSERT IGNORE INTO branch_inventory (branch_id, product_id, stock_quantity, min_stock_alert) VALUES
(2, 1, 15, 5), (2, 2, 20, 6), (2, 3, 10, 4), (2, 4, 8, 3), (2, 5, 14, 5),
(2, 6, 25, 8), (2, 7, 18, 5), (2, 8, 12, 4), (2, 9, 20, 5), (2, 10, 11, 4);

-- Sede 3: Cochabamba
INSERT IGNORE INTO branch_inventory (branch_id, product_id, stock_quantity, min_stock_alert) VALUES
(3, 1, 20, 5), (3, 2, 22, 6), (3, 3, 16, 4), (3, 4, 14, 3), (3, 5, 18, 5),
(3, 6, 28, 8), (3, 7, 19, 5), (3, 8, 15, 4), (3, 9, 22, 5), (3, 10, 13, 4);

-- 9. PERSONAL ESTÉTICO INICIAL
INSERT IGNORE INTO staff (id, branch_id, full_name, role, phone, email, active) VALUES
(1, 1, 'Lic. Claudia Mendoza', 'Encargada de Sucursal & Cosmetóloga', '+591 70112233', 'claudia.m@hermosatalitakumi.com', 1),
(2, 1, 'Ruth Arancibia', 'Terapeuta Corporal y Masajista', '+591 70223344', 'ruth.a@hermosatalitakumi.com', 1),
(3, 2, 'Lic. Gabriela Torrico', 'Encargada de Sucursal & Cosmiatra', '+591 70334455', 'gabriela.t@hermosatalitakumi.com', 1),
(4, 2, 'Noemí Paredes', 'Especialista en Baño de Luna y Masajes', '+591 70445566', 'noemi.p@hermosatalitakumi.com', 1),
(5, 3, 'Lic. Paola Camacho', 'Encargada de Sucursal Cochabamba', '+591 70556677', 'paola.c@hermosatalitakumi.com', 1),
(6, 3, 'Silvia Morales', 'Terapeuta Dérmica Integral', '+591 70667788', 'silvia.m@hermosatalitakumi.com', 1);

-- 10. REGLAS DÉRMICAS DE SEGUIMIENTO (Intervalos calculados en días)
INSERT IGNORE INTO treatment_rules (id, treatment_name, treatment_type, recommended_interval, interval_unit, description, active) VALUES
(1, 'Limpieza facial profunda', 'FACIAL', 21, 'DIAS', 'Recomendado cada 21 a 28 días para mantener poros limpios y regular secreción sebácea.', 1),
(2, 'Hidratación facial', 'FACIAL', 15, 'DIAS', 'Recomendado cada 15 días para preservar la humedad y evitar tirantez.', 1),
(3, 'Exfoliación facial', 'FACIAL', 14, 'DIAS', 'Recomendado cada dos semanas para renovación del estrato córneo sin irritación.', 1),
(4, 'Tratamiento iluminador facial', 'FACIAL', 21, 'DIAS', 'Intervalo ideal de 3 semanas para potenciar el efecto antioxidante.', 1),
(5, 'Tratamiento cosmético para mejorar la apariencia de manchas', 'FACIAL', 15, 'DIAS', 'Protocolo intensivo quincenal durante 6 sesiones continuas.', 1),
(6, 'Tratamiento facial antiarrugas', 'FACIAL', 14, 'DIAS', 'Recomendado cada 14 días para estimulación progresiva de colágeno.', 1),
(7, 'Tratamiento reafirmante facial', 'FACIAL', 10, 'DIAS', 'Intervalo de 10 días para sostener la tonicidad del óvalo facial.', 1),
(8, 'Tratamiento facial calmante', 'FACIAL', 14, 'DIAS', 'Recomendado cada 2 semanas para desensibilizar pieles reactivas.', 1),
(9, 'Tratamiento facial para piel grasa', 'FACIAL', 14, 'DIAS', 'Quincenal para equilibrio del manto hidrolipídico.', 1),
(10, 'Tratamiento facial revitalizante', 'FACIAL', 21, 'DIAS', 'Cada 3 semanas para sostener vitalidad y brillo natural.', 1),
(11, 'Baño de Luna cuerpo completo', 'LUNA', 30, 'DIAS', 'Recomendado una vez al mes para mantener el vello dorado y la piel sedosa.', 1),
(12, 'Exfoliación corporal', 'CORPORAL', 21, 'DIAS', 'Ciclo de 3 semanas para acompañar la renovación epidérmica corporal.', 1),
(13, 'Masaje relajante', 'MASAJE', 7, 'DIAS', 'Sesión semanal para prevención del estrés muscular y bienestar emocional.', 1);
