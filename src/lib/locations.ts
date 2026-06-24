export interface LocationItem {
  id: string;
  name: string;
}

export interface Distrito {
  cabecera?: string;
  barrios: LocationItem[];
}

export interface Canton {
  distritos: Record<string, Distrito>;
}

export const costaRicaLocations: Record<string, Canton> = {
  perez_zeledon: {
    distritos: {
      san_isidro_de_el_general: {
        barrios: [{ id: "pz_si_centro", name: "San Isidro de El General" }],
      },
      el_general: {
        barrios: [{ id: "pz_eg_centro", name: "El General" }],
      },
      general_viejo: {
        cabecera: "General Viejo",
        barrios: [
          { id: "pz_gv_gv", name: "General Viejo" },
          { id: "pz_gv_venecia", name: "Venecia" },
          { id: "pz_gv_nuevo_gen", name: "Nuevo General" },
          { id: "pz_gv_pb", name: "Peñas Blancas" },
          { id: "pz_gv_ingenio", name: "El Ingenio" },
          { id: "pz_gv_c_hidalgo", name: "Calle Hidalgo" },
          { id: "pz_gv_san_martin", name: "San Martín" },
          { id: "pz_gv_pinar_rio", name: "Pinar del Río" },
          { id: "pz_gv_la_linda", name: "La Linda" },
          { id: "pz_gv_el_carril", name: "El Carril" },
          { id: "pz_gv_paraiso", name: "Paraíso" },
          { id: "pz_gv_san_luis", name: "San Luis" },
          { id: "pz_gv_miraflores", name: "Miraflores" },
          { id: "pz_gv_santa_cruz", name: "Santa Cruz" },
          { id: "pz_gv_san_blas", name: "San Blas Linda Arriba" },
          { id: "pz_gv_la_hermosa", name: "La Hermosa" },
          { id: "pz_gv_quizarra", name: "Quizarrá" },
          { id: "pz_gv_montecarlo", name: "Montecarlo" },
        ],
      },
      santa_elena_de_el_general: {
        cabecera: "Santa Elena",
        barrios: [
          { id: "pz_se_santa_elena", name: "Santa Elena" },
          { id: "pz_se_trinidad", name: "Trinidad" },
          { id: "pz_se_las_nubes", name: "Las Nubes" },
          { id: "pz_se_la_paz", name: "La Paz" },
          { id: "pz_se_barrio_nuevo", name: "Barrio Nuevo" },
          { id: "pz_se_bajo_arias", name: "Bajo Los Arias" },
          { id: "pz_se_chumpulun", name: "El Chumpulún" },
          { id: "pz_se_calle_guzman", name: "Calle Guzmán" },
          { id: "pz_se_playa_verde", name: "Playa Verde" },
          { id: "pz_se_la_arepa", name: "La Arepa" },
        ],
      },
      daniel_flores: {
        cabecera: "Palmares",
        barrios: [
          { id: "pz_df_alto_brisas", name: "Alto Brisas" },
          { id: "pz_df_angeles", name: "Los Ángeles" },
          { id: "pz_df_aurora", name: "Aurora" },
          { id: "pz_df_los_chiles", name: "Los Chiles" },
          { id: "pz_df_crematorio", name: "Crematorio" },
          { id: "pz_df_zavaleta", name: "Daniel Flores Zavaleta" },
          { id: "pz_df_laboratorio", name: "Barrio Laboratorio" },
          { id: "pz_df_los_pinos", name: "Los Pinos" },
          { id: "pz_df_loma_verde", name: "Loma Verde" },
          { id: "pz_df_lourdes", name: "Lourdes" },
          { id: "pz_df_rosas", name: "Rosas" },
          { id: "pz_df_rosa_iris", name: "Rosa Iris" },
          { id: "pz_df_san_francisco", name: "San Francisco" },
          { id: "pz_df_st_margarita", name: "Santa Margarita" },
          { id: "pz_df_la_trocha", name: "La Trocha" },
          { id: "pz_df_villa_ligia", name: "Villa Ligia" },
          { id: "pz_df_aguas_buenas", name: "Aguas Buenas" },
          { id: "pz_df_bajos_pacuar", name: "Bajos de Pacuar" },
          { id: "pz_df_concepcion", name: "Concepción" },
          { id: "pz_df_corazon_jesus", name: "Corazón de Jesús" },
          { id: "pz_df_juntas_pacuar", name: "Juntas de Pacuar" },
          { id: "pz_df_paso_bote", name: "Paso Bote" },
          { id: "pz_df_patio_agua", name: "Patio de Agua San Juan Bosco" },
          { id: "pz_df_peje", name: "Peje" },
          { id: "pz_df_percal", name: "Percal" },
          { id: "pz_df_pinar_rio", name: "Pinar del Río" },
          { id: "pz_df_q_honda", name: "Quebrada Honda" },
          { id: "pz_df_repunta", name: "Repunta" },
          { id: "pz_df_los_reyes", name: "Los Reyes" },
          { id: "pz_df_la_ribera", name: "La Ribera" },
          { id: "pz_df_la_suiza", name: "La Suiza" },
        ],
      },
      rivas: {
        barrios: [
          { id: "pz_ri_san_gerardo", name: "San Gerardo" },
          { id: "pz_ri_canaan", name: "Canaán" },
          { id: "pz_ri_chimirol", name: "Chimirol" },
          { id: "pz_ri_herradura", name: "Herradura" },
          { id: "pz_ri_angeles", name: "Los Ángeles" },
          { id: "pz_ri_guadalupe", name: "Guadalupe" },
          { id: "pz_ri_san_francisco", name: "San Francisco" },
          { id: "pz_ri_talari", name: "Talari" },
          { id: "pz_ri_san_jose", name: "San José" },
          { id: "pz_ri_monterrey", name: "Monterrey" },
          { id: "pz_ri_c_mora", name: "Calle Los Mora" },
          { id: "pz_ri_zapotal", name: "Zapotal" },
          { id: "pz_ri_chispa", name: "Chispa" },
          { id: "pz_ri_chuma", name: "Chuma" },
          { id: "pz_ri_rio_blanco", name: "Río Blanco" },
          { id: "pz_ri_buena_vista", name: "Buena Vista" },
          { id: "pz_ri_la_piedra", name: "La Piedra" },
          { id: "pz_ri_palmital", name: "Palmital" },
          { id: "pz_ri_sj_norte", name: "San Juan Norte" },
          { id: "pz_ri_alaska", name: "Alaska" },
          { id: "pz_ri_piedra_alta", name: "Piedra Alta" },
          { id: "pz_ri_alto_jaular", name: "Alto Jaular" },
          { id: "pz_ri_san_cayetano", name: "San Cayetano" },
          { id: "pz_ri_las_playas", name: "Las Playas" },
          { id: "pz_ri_rivas_p", name: "Rivas" },
          { id: "pz_ri_pueblo_nuevo", name: "Pueblo Nuevo" },
          { id: "pz_ri_miravalles", name: "Miravalles" },
          { id: "pz_ri_la_bonita", name: "La Bonita" },
          { id: "pz_ri_linda_vista", name: "Linda Vista" },
          { id: "pz_ri_tirra", name: "Tirrá" },
          { id: "pz_ri_la_bambu", name: "La Bambú" },
          { id: "pz_ri_san_antonio", name: "San Antonio" },
          { id: "pz_ri_lourdes", name: "Lourdes" },
          { id: "pz_ri_santa_marta", name: "Santa Marta" },
          { id: "pz_ri_division", name: "División" },
          { id: "pz_ri_el_jardin", name: "El Jardín" },
          { id: "pz_ri_villa_mills", name: "Villa Mills" },
          { id: "pz_ri_macho_mora", name: "Macho Mora" },
          { id: "pz_ri_siberia", name: "El Nivel Siberia" },
        ],
      },
      san_pedro: {
        barrios: [
          { id: "pz_sp_cruz_roja", name: "Cruz Roja" },
          { id: "pz_sp_san_pedro", name: "San Pedro" },
          { id: "pz_sp_arenilla", name: "Arenilla" },
          { id: "pz_sp_alto_calderon", name: "Alto Calderón" },
          { id: "pz_sp_cedral", name: "Cedral" },
          { id: "pz_sp_colonia", name: "Colonia" },
          { id: "pz_sp_cristo_rey", name: "Cristo Rey" },
          { id: "pz_sp_esperanza", name: "Esperanza" },
          { id: "pz_sp_fatima", name: "Fátima" },
          { id: "pz_sp_fortuna", name: "Fortuna" },
          { id: "pz_sp_guaria", name: "Guaria" },
          { id: "pz_sp_angeles", name: "Los Ángeles" },
          { id: "pz_sp_laguna", name: "Laguna" },
          { id: "pz_sp_n_hortensia", name: "Nueva Hortensia" },
          { id: "pz_sp_n_santa_ana", name: "Nueva Santa Ana" },
          { id: "pz_sp_rinconada", name: "Rinconada Vega" },
          { id: "pz_sp_s_jeronimo", name: "San Jerónimo" },
          { id: "pz_sp_s_juan", name: "San Juan" },
          { id: "pz_sp_s_juancito", name: "San Juancito" },
          { id: "pz_sp_s_rafael", name: "San Rafael" },
          { id: "pz_sp_santa_ana", name: "Santa Ana" },
          { id: "pz_sp_st_cecilia", name: "Santa Cecilia" },
          { id: "pz_sp_s_domingo", name: "Santo Domingo" },
          { id: "pz_sp_santiago", name: "Santiago" },
          { id: "pz_sp_tambor", name: "Tambor" },
          { id: "pz_sp_union", name: "Unión" },
          { id: "pz_sp_zapotal", name: "Zapotal" },
        ],
      },
      platanares: {
        cabecera: "San Rafael",
        barrios: [
          { id: "pz_pl_aguas_buenas", name: "Aguas Buenas" },
          { id: "pz_pl_b_bonitas", name: "Bajo Bonitas" },
          { id: "pz_pl_b_espinoza", name: "Bajo Espinoza" },
          { id: "pz_pl_bolivia", name: "Bolivia" },
          { id: "pz_pl_bonitas", name: "Bonitas" },
          { id: "pz_pl_b_aires", name: "Buenos Aires" },
          { id: "pz_pl_concepcion", name: "Concepción" },
          { id: "pz_pl_cristo_rey", name: "Cristo Rey" },
          { id: "pz_pl_la_sierra", name: "La Sierra" },
          { id: "pz_pl_lourdes", name: "Lourdes" },
          { id: "pz_pl_mastatal", name: "Mastatal" },
          { id: "pz_pl_mollejoncito", name: "Mollejoncito" },
          { id: "pz_pl_mollejones", name: "Mollejones" },
          { id: "pz_pl_naranjos", name: "Naranjos" },
          { id: "pz_pl_s_pablito", name: "San Pablito" },
          { id: "pz_pl_san_pablo", name: "San Pablo" },
          { id: "pz_pl_socorro", name: "Socorro" },
          { id: "pz_pl_surtubal", name: "Surtubal" },
          { id: "pz_pl_v_argentina", name: "Villa Argentina" },
          { id: "pz_pl_v_flor", name: "Villa Flor" },
          { id: "pz_pl_vista_mar", name: "Vista de Mar" },
          { id: "pz_pl_san_gerardo", name: "San Gerardo" },
        ],
      },
      pejibaye: {
        barrios: [
          { id: "pz_pe_achiotal", name: "Achiotal" },
          { id: "pz_pe_aguila", name: "Águila" },
          { id: "pz_pe_alto_trinidad", name: "Alto Trinidad Puñal" },
          { id: "pz_pe_bajo_caliente", name: "Bajo Caliente" },
          { id: "pz_pe_bajo_minas", name: "Bajo Minas" },
          { id: "pz_pe_barrionuevo", name: "Barrionuevo" },
          { id: "pz_pe_bellavista", name: "Bellavista" },
          { id: "pz_pe_calientillo", name: "Calientillo" },
          { id: "pz_pe_delicias", name: "Delicias" },
          { id: "pz_pe_desamparados", name: "Desamparados" },
          { id: "pz_pe_el_progreso", name: "El Progreso" },
          { id: "pz_pe_gibre", name: "Gibre" },
          { id: "pz_pe_guadalupe", name: "Guadalupe" },
          { id: "pz_pe_las_cruces", name: "Las Cruces" },
          { id: "pz_pe_mesas", name: "Mesas" },
          { id: "pz_pe_minas", name: "Minas" },
          { id: "pz_pe_paraiso", name: "Paraíso" },
          { id: "pz_pe_san_marcos", name: "San Marcos" },
          { id: "pz_pe_san_martin", name: "San Martín" },
          { id: "pz_pe_san_miguel", name: "San Miguel" },
          { id: "pz_pe_santa_fe", name: "Santa Fe" },
          { id: "pz_pe_surtubal", name: "Surtubal" },
          { id: "pz_pe_trinidad", name: "Trinidad" },
          { id: "pz_pe_veracruz", name: "Veracruz" },
          { id: "pz_pe_zapote", name: "Zapote" },
        ],
      },
      cajon: {
        barrios: [
          { id: "pz_ca_cedral", name: "Cedral" },
          { id: "pz_ca_quemado", name: "El Quemado" },
          { id: "pz_ca_gloria", name: "Gloria" },
          { id: "pz_ca_brisas", name: "Las Brisas" },
          { id: "pz_ca_los_vega", name: "Los Vega" },
          { id: "pz_ca_mercedes", name: "Mercedes" },
          { id: "pz_ca_montecarlo", name: "Montecarlo" },
          { id: "pz_ca_navajuelar", name: "Navajuelar" },
          { id: "pz_ca_nubes", name: "Nubes" },
          { id: "pz_ca_paraiso", name: "Paraíso" },
          { id: "pz_ca_pilar", name: "Pilar" },
          { id: "pz_ca_pueblo_nuevo", name: "Pueblo Nuevo" },
          { id: "pz_ca_quizarra", name: "Quizarrá" },
          { id: "pz_ca_salitrales", name: "Salitrales" },
          { id: "pz_ca_san_francisco", name: "San Francisco" },
          { id: "pz_ca_san_ignacio", name: "San Ignacio" },
          { id: "pz_ca_san_pedrito", name: "San Pedrito" },
          { id: "pz_ca_santa_maria", name: "Santa María" },
          { id: "pz_ca_santa_teresa", name: "Santa Teresa" },
        ],
      },
      baru: {
        cabecera: "Platanillo",
        barrios: [
          { id: "pz_ba_alfombra", name: "Alfombra" },
          { id: "pz_ba_alto_perla", name: "Alto Perla" },
          { id: "pz_ba_bajos", name: "Bajos" },
          { id: "pz_ba_b_zapotal", name: "Bajos de Zapotal" },
          { id: "pz_ba_baru_p", name: "Barú" },
          { id: "pz_ba_barucito", name: "Barucito" },
          { id: "pz_ba_cacao", name: "Cacao" },
          { id: "pz_ba_camarones", name: "Camarones" },
          { id: "pz_ba_canablanca", name: "Cañablanca" },
          { id: "pz_ba_ceiba", name: "Ceiba" },
          { id: "pz_ba_chontales", name: "Chontales" },
          { id: "pz_ba_farallas", name: "Farallas" },
          { id: "pz_ba_florida", name: "Florida" },
          { id: "pz_ba_sj_dios", name: "San Juan de Dios Guabo" },
          { id: "pz_ba_libano", name: "Líbano" },
          { id: "pz_ba_magnolia", name: "Magnolia" },
          { id: "pz_ba_pozos", name: "Pozos" },
          { id: "pz_ba_reina", name: "Reina" },
          { id: "pz_ba_san_marcos", name: "San Marcos" },
          { id: "pz_ba_san_salvador", name: "San Salvador" },
          { id: "pz_ba_st_juana", name: "Santa Juana" },
          { id: "pz_ba_sto_cristo", name: "Santo Cristo" },
          { id: "pz_ba_tinamaste", name: "Tinamaste San Cristóbal" },
          { id: "pz_ba_torito", name: "Torito" },
          { id: "pz_ba_tres_piedras", name: "Tres Piedras" },
          { id: "pz_ba_tumbas", name: "Tumbas" },
          { id: "pz_ba_villabonita", name: "Villabonita" },
          { id: "pz_ba_vista_mar", name: "Vista Mar" },
        ],
      },
      rio_nuevo: {
        barrios: [
          { id: "pz_rn_santa_rosa", name: "Santa Rosa" },
          { id: "pz_rn_san_antonio", name: "San Antonio" },
          { id: "pz_rn_calle_mora", name: "Calle Mora" },
          { id: "pz_rn_sj_cruz", name: "San Juan de la Cruz Alto los Mena" },
          { id: "pz_rn_santa_marta", name: "Santa Marta" },
          { id: "pz_rn_purruja", name: "La Purruja" },
          { id: "pz_rn_san_cayetano", name: "San Cayetano" },
          { id: "pz_rn_chirricano", name: "Chirricano" },
          { id: "pz_rn_savegre", name: "Savegre" },
          { id: "pz_rn_el_llano", name: "El Llano" },
          { id: "pz_rn_el_brujo", name: "El Brujo" },
          { id: "pz_rn_p_blancas", name: "Piedras Blancas" },
          { id: "pz_rn_zaragoza", name: "Zaragoza" },
          { id: "pz_rn_santa_lucia", name: "Santa Lucía" },
          { id: "pz_rn_california", name: "California" },
        ],
      },
      paramo: {
        cabecera: "San Ramón Sur",
        barrios: [
          { id: "pz_pa_macho_mora", name: "Alto Macho Mora" },
          { id: "pz_pa_siberia", name: "Siberia" },
          { id: "pz_pa_division", name: "División" },
          { id: "pz_pa_miramar", name: "Miramar" },
          { id: "pz_pa_jardin", name: "Jardín" },
          { id: "pz_pa_la_hortensia", name: "La Hortensia" },
          { id: "pz_pa_la_ese", name: "La Ese" },
          { id: "pz_pa_matazanos", name: "Matazanos" },
          { id: "pz_pa_valencia", name: "Valencia" },
          { id: "pz_pa_sr_sur", name: "San Ramón Sur" },
          { id: "pz_pa_sr_norte", name: "San Ramón Norte" },
          { id: "pz_pa_berlin", name: "Berlín" },
          { id: "pz_pa_angeles", name: "Ángeles" },
          { id: "pz_pa_sto_tomas", name: "Santo Tomás" },
          { id: "pz_pa_st_eduviges", name: "Santa Eduviges" },
          { id: "pz_pa_san_miguel", name: "San Miguel" },
          { id: "pz_pa_pedregosito", name: "Pedregosito" },
        ],
      },
      la_amistad: {
        cabecera: "San Antonio",
        barrios: [
          { id: "pz_am_corralillo", name: "Corralillo" },
          { id: "pz_am_china_kicha", name: "China Kicha" },
          { id: "pz_am_montezuma", name: "Montezuma" },
          { id: "pz_am_oratorio", name: "Oratorio" },
          { id: "pz_am_san_carlos", name: "San Carlos" },
          { id: "pz_am_san_gabriel", name: "San Gabriel" },
          { id: "pz_am_san_roque", name: "San Roque" },
          { id: "pz_am_st_cecilia", name: "Santa Cecilia" },
          { id: "pz_am_st_luisa", name: "Santa Luisa" },
        ],
      },
    },
  },
  osa: {
    distritos: {
      puerto_cortes: {
        barrios: [
          { id: "osa_pc_canada", name: "Canadá" },
          { id: "osa_pc_cementerio", name: "Cementerio" },
          { id: "osa_pc_5esquinas", name: "Cinco Esquinas" },
          { id: "osa_pc_montreal", name: "Montreal" },
          { id: "osa_pc_precario", name: "Precario" },
          { id: "osa_pc_pueblo_nuevo", name: "Pueblo Nuevo" },
          { id: "osa_pc_renacimiento", name: "Renacimiento" },
          { id: "osa_pc_yuca", name: "Yuca" },
          { id: "osa_pc_balsar", name: "Balsar" },
          { id: "osa_pc_bocabrava", name: "Bocabrava" },
          { id: "osa_pc_bocachica", name: "Bocachica" },
          { id: "osa_pc_cerron", name: "Cerrón" },
          { id: "osa_pc_coronado", name: "Coronado" },
          { id: "osa_pc_chontales", name: "Chontales" },
          { id: "osa_pc_delicias", name: "Delicias" },
          { id: "osa_pc_embarcadero", name: "Embarcadero" },
          { id: "osa_pc_fuente", name: "Fuente" },
          { id: "osa_pc_isla_sorpresa", name: "Isla Sorpresa" },
          { id: "osa_pc_lindavista", name: "Lindavista" },
          { id: "osa_pc_lourdes", name: "Lourdes" },
          { id: "osa_pc_ojochal", name: "Ojochal" },
          { id: "osa_pc_ojo_agua", name: "Ojo de Agua" },
          { id: "osa_pc_parcelas", name: "Parcelas" },
          { id: "osa_pc_pozo", name: "Pozo" },
          { id: "osa_pc_punta_mala", name: "Punta Mala" },
          { id: "osa_pc_p_mala_arriba", name: "Punta Mala Arriba" },
          { id: "osa_pc_s_buenaventura", name: "San Buenaventura" },
          { id: "osa_pc_san_juan", name: "San Juan" },
          { id: "osa_pc_san_marcos", name: "San Marcos" },
          { id: "osa_pc_tagual", name: "Tagual" },
          { id: "osa_pc_tortuga_abajo", name: "Tortuga Abajo" },
          { id: "osa_pc_tres_rios", name: "Tres Ríos" },
          { id: "osa_pc_v_terraba", name: "Vista de Térraba" },
        ],
      },
      palmar: {
        cabecera: "Palmar Norte",
        barrios: [
          { id: "osa_pa_betania", name: "Betania" },
          { id: "osa_pa_11abril", name: "Once de Abril" },
          { id: "osa_pa_brisas", name: "Las Brisas" },
          { id: "osa_pa_luz_mundo", name: "La luz del mundo" },
          { id: "osa_pa_alemania", name: "Alemania" },
          { id: "osa_pa_alto_angeles", name: "Alto Ángeles" },
          { id: "osa_pa_alto_encanto", name: "Alto Encanto" },
          { id: "osa_pa_alto_montura", name: "Alto Montura" },
          { id: "osa_pa_bellavista", name: "Bellavista" },
          { id: "osa_pa_calavera", name: "Calavera" },
          { id: "osa_pa_cansot", name: "Cansot" },
          { id: "osa_pa_canablancal_e", name: "Cañablancal Este" },
          { id: "osa_pa_canablancal_o", name: "Cañablancal Oeste" },
          { id: "osa_pa_coobo", name: "Coobó Progreso" },
          { id: "osa_pa_coquito", name: "Coquito" },
          { id: "osa_pa_gorrion", name: "Gorrión" },
          { id: "osa_pa_jalaca", name: "Jalaca" },
          { id: "osa_pa_olla_cero", name: "Olla Cero" },
          { id: "osa_pa_palma", name: "Palma" },
          { id: "osa_pa_paraiso", name: "Paraíso" },
          { id: "osa_pa_1marzo", name: "Primero de Marzo" },
          { id: "osa_pa_p_del_sol", name: "Puerta del Sol" },
          { id: "osa_pa_s_cristobal", name: "San Cristóbal" },
          { id: "osa_pa_s_francisco", name: "San Francisco Tinoco" },
          { id: "osa_pa_s_gabriel", name: "San Gabriel" },
          { id: "osa_pa_s_isidro", name: "San Isidro" },
          { id: "osa_pa_s_rafael", name: "San Rafael" },
          { id: "osa_pa_santa_elena", name: "Santa Elena" },
          { id: "osa_pa_silencio", name: "Silencio" },
          { id: "osa_pa_trocha", name: "Trocha" },
          { id: "osa_pa_vergel", name: "Vergel" },
          { id: "osa_pa_victoria", name: "Victoria" },
          { id: "osa_pa_zapote", name: "Zapote" },
        ],
      },
      sierpe: {
        barrios: [
          { id: "osa_si_ajuntaderas", name: "Ajuntaderas" },
          { id: "osa_si_alto_mogos", name: "Alto Los Mogos" },
          { id: "osa_si_alto_sj", name: "Alto San Juan" },
          { id: "osa_si_bahia_chal", name: "Bahía Chal" },
          { id: "osa_si_bajos_matias", name: "Bajos Matías" },
          { id: "osa_si_barco", name: "Barco" },
          { id: "osa_si_bejuco", name: "Bejuco" },
          { id: "osa_si_b_chocuaco", name: "Boca Chocuaco" },
          { id: "osa_si_gallega", name: "Gallega" },
          { id: "osa_si_camibar", name: "Camíbar" },
          { id: "osa_si_c_aguabuena", name: "Campo de Aguabuena" },
          { id: "osa_si_cantarrana", name: "Cantarrana" },
          { id: "osa_si_charcos", name: "Charcos" },
          { id: "osa_si_chocuaco", name: "Chocuaco" },
          { id: "osa_si_garrobo", name: "Garrobo" },
          { id: "osa_si_guabos", name: "Guabos" },
          { id: "osa_si_isidora", name: "Isidora" },
          { id: "osa_si_islotes", name: "Islotes" },
          { id: "osa_si_jalaca", name: "Jalaca" },
          { id: "osa_si_julia", name: "Julia" },
          { id: "osa_si_miramar", name: "Miramar" },
          { id: "osa_si_mogos", name: "Mogos" },
          { id: "osa_si_monterrey", name: "Monterrey" },
          { id: "osa_si_p_palma", name: "Playa Palma" },
          { id: "osa_si_playitas", name: "Playitas" },
          { id: "osa_si_potrero", name: "Potrero" },
          { id: "osa_si_p_escondido", name: "Puerto Escondido" },
          { id: "osa_si_rincon", name: "Rincón" },
          { id: "osa_si_sabalo", name: "Sábalo" },
          { id: "osa_si_s_gerardo", name: "San Gerardo" },
          { id: "osa_si_san_juan", name: "San Juan" },
          { id: "osa_si_taboga", name: "Taboga" },
          { id: "osa_si_taboguita", name: "Taboguita" },
          { id: "osa_si_tigre", name: "Tigre" },
          { id: "osa_si_varillal", name: "Varillal" },
        ],
      },
      piedras_blancas: {
        barrios: [
          { id: "osa_pb_angeles", name: "Ángeles" },
          { id: "osa_pb_bellavista", name: "Bellavista" },
          { id: "osa_pb_calera", name: "Calera" },
          { id: "osa_pb_c_oscuro", name: "Cerro Oscuro" },
          { id: "osa_pb_chacarita", name: "Chacarita" },
          { id: "osa_pb_fila", name: "Fila" },
          { id: "osa_pb_f_alajuela", name: "Finca Alajuela" },
          { id: "osa_pb_f_guanacaste", name: "Finca Guanacaste" },
          { id: "osa_pb_f_puntarenas", name: "Finca Puntarenas" },
          { id: "osa_pb_florida", name: "Florida" },
          { id: "osa_pb_guaria", name: "Guaria" },
          { id: "osa_pb_k40", name: "Kilómetro 40" },
          { id: "osa_pb_navidad", name: "Navidad" },
          { id: "osa_pb_nubes", name: "Nubes" },
          { id: "osa_pb_porvenir", name: "Porvenir" },
          { id: "osa_pb_r_caliente", name: "Rincón Caliente" },
          { id: "osa_pb_salama", name: "Salamá" },
          { id: "osa_pb_san_martin", name: "San Martín" },
          { id: "osa_pb_st_cecilia", name: "Santa Cecilia" },
          { id: "osa_pb_santa_rosa", name: "Santa Rosa" },
          { id: "osa_pb_sinai", name: "Sinaí" },
          { id: "osa_pb_venecia", name: "Venecia" },
          { id: "osa_pb_v_bonita", name: "Villa Bonita" },
          { id: "osa_pb_v_colon", name: "Villa Colón" },
        ],
      },
      bahia_ballena: {
        cabecera: "Villa de Uvita",
        barrios: [
          { id: "osa_bb_b_ballena", name: "Bahía Ballena" },
          { id: "osa_bb_cambutal", name: "Cambutal" },
          { id: "osa_bb_dominical", name: "Dominical" },
          { id: "osa_bb_dominicalito", name: "Dominicalito" },
          { id: "osa_bb_escaleras", name: "Escaleras" },
          { id: "osa_bb_pinuela", name: "Piñuela" },
          { id: "osa_bb_p_hermosa", name: "Playa Hermosa" },
          { id: "osa_bb_q_grande", name: "Quebrada Grande" },
          { id: "osa_bb_s_josecito", name: "San Josecito" },
          { id: "osa_bb_san_martin", name: "San Martín" },
          { id: "osa_bb_tortuga_arr", name: "Tortuga Arriba" },
        ],
      },
      bahia_drake: {
        cabecera: "Villa Agujitas Drake",
        barrios: [
          { id: "osa_bd_angeles", name: "Ángeles" },
          { id: "osa_bd_banegas", name: "Banegas" },
          { id: "osa_bd_boca_ganado", name: "Boca Ganado" },
          { id: "osa_bd_campanario", name: "Campanario" },
          { id: "osa_bd_caletas", name: "Caletas" },
          { id: "osa_bd_guerra", name: "Guerra" },
          { id: "osa_bd_planes", name: "Planes" },
          { id: "osa_bd_progreso", name: "Progreso" },
          { id: "osa_bd_q_ganado", name: "Quebrada Ganado" },
          { id: "osa_bd_r_quemado", name: "Rancho Quemado" },
          { id: "osa_bd_riyito", name: "Riyito" },
          { id: "osa_bd_s_josecito", name: "San Josecito Rincón" },
          { id: "osa_bd_san_pedrillo", name: "San Pedrillo" },
        ],
      },
    },
  },
};

// ─── Adapters for Backward Compatibility ────────────────────────────────────

export interface LegacyDistrict {
  slug: string;
  label: string;
  parentSlug: string;
  coords?: [number, number, number];
}

export interface LegacyCanton {
  label: string;
  areaSlug: string;
  districts: LegacyDistrict[];
}

function formatSlug(slug: string): string {
  return slug.replace(/_/g, "-");
}

export const ALL_DISTRICTS: LegacyDistrict[] = [];
export const ACM_CANTONS: LegacyCanton[] = [];

// Fallback coordinates for legacy integration
const COORDS_MAP: Record<string, [number, number, number]> = {
  "san-isidro-de-el-general": [9.3787, -83.7008, 14],
  "el-general": [9.355, -83.655, 14],
  "daniel-flores": [9.345, -83.68, 14],
  rivas: [9.465, -83.685, 13],
  "san-pedro": [9.315, -83.63, 13],
  platanares: [9.31, -83.72, 13],
  pejibaye: [9.28, -83.59, 13],
  cajon: [9.22, -83.61, 13],
  baru: [9.29, -83.81, 13],
  "rio-nuevo": [9.305, -83.77, 13],
  paramo: [9.51, -83.72, 13],
  "la-amistad": [9.31, -83.52, 12],
  "bahia-ballena": [9.155, -83.745, 14],
  "puerto-cortes": [8.96, -83.53, 13],
  palmar: [8.95, -83.47, 13],
  sierpe: [8.87, -83.48, 13],
  "piedras-blancas": [8.78, -83.35, 13],
  "bahia-drake": [8.7, -83.55, 13],
  "quepos-centro": [9.431, -84.162, 14],
  savegre: [9.32, -83.91, 13],
  naranjito: [9.41, -84.07, 13],
  "manuel-antonio": [9.392, -84.14, 14],
};

for (const [cantonKey, cantonData] of Object.entries(costaRicaLocations)) {
  const areaSlug = cantonKey === "osa" ? "dominical" : formatSlug(cantonKey);
  const label =
    cantonKey === "perez_zeledon"
      ? "Pérez Zeledón"
      : cantonKey === "osa"
        ? "Osa (Dominical–Uvita)"
        : cantonKey;

  const districts: LegacyDistrict[] = [];

  for (const [distritoKey, distritoData] of Object.entries(cantonData.distritos)) {
    const slug = formatSlug(distritoKey);
    let dLabel = distritoData.cabecera;
    if (!dLabel) {
      dLabel = slug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }

    // Attempt to map coords for older district slugs
    // User structure changed san-isidro to san-isidro-de-el-general
    const coordKey = slug === "san-isidro-de-el-general" ? "san-isidro-de-el-general" : slug;

    const district: LegacyDistrict = {
      slug,
      label: dLabel,
      parentSlug: areaSlug,
      coords: COORDS_MAP[coordKey] || COORDS_MAP[slug],
    };
    districts.push(district);
    ALL_DISTRICTS.push(district);
  }

  ACM_CANTONS.push({
    label,
    areaSlug,
    districts,
  });
}

// Ensure Quepos is still available since it's in the old structure but missing from the user's snippet
const QUEPOS_DISTRICTS: LegacyDistrict[] = [
  { slug: "quepos-centro", label: "Quepos", parentSlug: "quepos", coords: [9.431, -84.162, 14] },
  { slug: "savegre", label: "Savegre", parentSlug: "quepos", coords: [9.32, -83.91, 13] },
  { slug: "naranjito", label: "Naranjito", parentSlug: "quepos", coords: [9.41, -84.07, 13] },
  {
    slug: "manuel-antonio",
    label: "Manuel Antonio",
    parentSlug: "quepos",
    coords: [9.392, -84.14, 14],
  },
];

ACM_CANTONS.push({
  label: "Quepos",
  areaSlug: "quepos",
  districts: QUEPOS_DISTRICTS,
});
QUEPOS_DISTRICTS.forEach((d) => ALL_DISTRICTS.push(d));

export const DISTRICT_BY_SLUG: Record<string, LegacyDistrict> = Object.fromEntries(
  ALL_DISTRICTS.map((d) => [d.slug, d]),
);

export function getDistrictLabel(slug: string): string {
  const d = DISTRICT_BY_SLUG[slug];
  if (d) return d.label;
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getDistrictParent(slug: string): string | null {
  return DISTRICT_BY_SLUG[slug]?.parentSlug ?? null;
}

// ─── Keyword Matching (for resolving API Location strings) ──────────────────

export const DISTRICT_KEYWORDS: { keyword: string; slug: string; parent: string }[] = [];

// Dynamically generate keywords from the new hierarchy
for (const [cantonKey, cantonData] of Object.entries(costaRicaLocations)) {
  const parent = cantonKey === "osa" ? "dominical" : formatSlug(cantonKey);

  for (const [distritoKey, distritoData] of Object.entries(cantonData.distritos)) {
    const slug = formatSlug(distritoKey);

    // Add distrito name/cabecera
    if (distritoData.cabecera) {
      DISTRICT_KEYWORDS.push({ keyword: distritoData.cabecera.toLowerCase(), slug, parent });
    }
    DISTRICT_KEYWORDS.push({ keyword: distritoKey.replace(/_/g, " ").toLowerCase(), slug, parent });

    // Add all barrios to map to this distrito
    for (const barrio of distritoData.barrios) {
      // Avoid tiny generic words
      if (barrio.name.length > 3) {
        // Some names are "San Isidro de El General", some are "Barrio Nuevo"
        // In the reconnect strings, we want to match these against the property description
        // Store both exact name and some variations if needed
        const cleanName = barrio.name.toLowerCase();
        DISTRICT_KEYWORDS.push({ keyword: cleanName, slug, parent });

        // If there's a compound name like "Patio de Agua San Juan Bosco",
        // full-phrase matching is sufficient — no need to split into parts.
      }
    }
  }
}

// Custom manual additions for common reconnect aliases that don't match exactly
const MANUAL_ALIASES = [
  { keyword: "rise costa rica", slug: "el-general", parent: "perez-zeledon" },
  { keyword: "rise", slug: "el-general", parent: "perez-zeledon" },
  { keyword: "nuevo general", slug: "general-viejo", parent: "perez-zeledon" },
  { keyword: "peñas blancas", slug: "general-viejo", parent: "perez-zeledon" },
  { keyword: "daniel flores zavaleta", slug: "daniel-flores", parent: "perez-zeledon" },
  { keyword: "marino ballena", slug: "bahia-ballena", parent: "dominical" },
  { keyword: "uvita", slug: "bahia-ballena", parent: "dominical" },
  { keyword: "tinamastes", slug: "baru", parent: "perez-zeledon" },
  { keyword: "ciudad cortes", slug: "puerto-cortes", parent: "ojochal" },
  {
    keyword: "santa elena, general viejo",
    slug: "santa-elena-de-el-general",
    parent: "perez-zeledon",
  },
  {
    keyword: "santa elena, san isidro",
    slug: "santa-elena-de-el-general",
    parent: "perez-zeledon",
  },
  {
    keyword: "santa elena, perez zeledon",
    slug: "santa-elena-de-el-general",
    parent: "perez-zeledon",
  },
  {
    keyword: "santa elena, pérez zeledón",
    slug: "santa-elena-de-el-general",
    parent: "perez-zeledon",
  },
  { keyword: "pueblo nuevo de cajon", slug: "cajon", parent: "perez-zeledon" },
  { keyword: "pueblo nuevo de cajón", slug: "cajon", parent: "perez-zeledon" },
  { keyword: "san francisco de cajon", slug: "cajon", parent: "perez-zeledon" },
  { keyword: "san francisco de cajón", slug: "cajon", parent: "perez-zeledon" },
  { keyword: "cedral de cajon", slug: "cajon", parent: "perez-zeledon" },
  { keyword: "cedral de cajón", slug: "cajon", parent: "perez-zeledon" },
  { keyword: "san miguel de paramo", slug: "paramo", parent: "perez-zeledon" },
  { keyword: "san miguel de páramo", slug: "paramo", parent: "perez-zeledon" },
  { keyword: "san rafael de platanares", slug: "platanares", parent: "perez-zeledon" },
];

MANUAL_ALIASES.forEach((alias) => DISTRICT_KEYWORDS.push(alias));

// Sort by length descending so longer, more specific phrases match first
// (e.g. "san isidro de el general" matches before "san isidro")
DISTRICT_KEYWORDS.sort((a, b) => b.keyword.length - a.keyword.length);
