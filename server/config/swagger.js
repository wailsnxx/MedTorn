// server/config/swagger.js — Especificació OpenAPI 3.0 de MedTorn
'use strict';

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'MedTorn API',
    version: '1.0.0',
    description:
      'API REST per a la gestió de torns mèdics de l\'Hospital General de Granollers.\n\n' +
      'Totes les rutes comencen amb `/api`. Els IDs corresponen a ObjectIds de MongoDB.',
    contact: { name: 'MedTorn Dev' }
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Servidor local (dev)' }
  ],

  // ── Components (schemas reutilitzables) ───────────────────────────────────
  components: {
    schemas: {

      // ── Metge ──────────────────────────────────────────────────────────────
      Metge: {
        type: 'object',
        properties: {
          id:           { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d0e' },
          name:         { type: 'string', example: 'Dr. Jordi Puig Fernández' },
          specialty:    { type: 'string', example: 'Cardiologia' },
          subspecialty: { type: 'string', example: 'Electrofisiologia' },
          unit:         { type: 'string', example: 'UCI' },
          collegiat:    { type: 'string', example: '080012345' },
          experience:   { type: 'integer', example: 12 },
          languages:    { type: 'array', items: { type: 'string' }, example: ['Català', 'Castellà'] },
          status: {
            type: 'string',
            enum: ['disponible', 'en-torn', 'baixa', 'vacances', 'ocupat', 'pausa'],
            example: 'disponible'
          },
          estat: {
            type: 'string',
            enum: ['DISPONIBLE', 'EN_TORN', 'BAIXA', 'VACANCES', 'OCUPAT', 'PAUSA'],
            example: 'DISPONIBLE'
          },
          avatar:      { type: 'string', format: 'uri', example: 'https://ui-avatars.com/api/?name=Jordi+Puig' },
          competences: { type: 'array', items: { type: 'string' }, example: ['Ecocardiografia', 'ACLS'] },
          shifts: {
            type: 'array',
            items: { type: 'string', enum: ['M', 'T', 'N', 'G', 'L', 'B'] },
            minItems: 7,
            maxItems: 7,
            description: '7 posicions (Dl–Dg). M=Matí, T=Tarda, N=Nit, G=Guàrdia, L=Lliure, B=Baixa',
            example: ['M', 'M', 'T', 'T', 'L', 'L', 'L']
          }
        }
      },

      MetgeStats: {
        type: 'object',
        properties: {
          disponibles:    { type: 'integer', example: 8 },
          enTorn:         { type: 'integer', example: 15 },
          baixa:          { type: 'integer', example: 2 },
          reemplacaments: { type: 'integer', example: 5 }
        }
      },

      // ── Torn ───────────────────────────────────────────────────────────────
      Torn: {
        type: 'object',
        properties: {
          id:        { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d0f' },
          data:      { type: 'string', format: 'date-time', example: '2026-04-22T00:00:00.000Z' },
          tipus:     { type: 'string', enum: ['MATI', 'TARDA', 'NIT', 'GUARDIA', 'LLIURE', 'BAIXA'] },
          codi:      { type: 'string', enum: ['M', 'T', 'N', 'G', 'L', 'B'] },
          horaInici: { type: 'string', example: '08:00' },
          horaFinal: { type: 'string', example: '15:00' },
          unitat:    { type: 'string', example: 'UCI' },
          metge_id:  { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d0e' }
        }
      },

      MonthlyShifts: {
        type: 'object',
        additionalProperties: { type: 'string', enum: ['M', 'T', 'N', 'G', 'L', 'B'] },
        example: { '2026-04-01': 'M', '2026-04-02': 'T', '2026-04-07': 'L' }
      },

      // ── Cas ────────────────────────────────────────────────────────────────
      Cas: {
        type: 'object',
        properties: {
          id:       { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d10' },
          title:    { type: 'string', example: 'Revisió post-quirúrgica' },
          patient:  { type: 'string', example: 'Maria García López' },
          room:     { type: 'string', example: '302B' },
          priority: { type: 'string', enum: ['alta', 'mitja', 'baixa'] },
          time:     { type: 'string', example: '09:30' },
          detail:   { type: 'string', example: 'Control de constants i canvi d\'apòsit' },
          metge_id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d0e' }
        }
      },

      // ── Solicitud ──────────────────────────────────────────────────────────
      Solicitud: {
        type: 'object',
        properties: {
          id:      { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d11' },
          type:    { type: 'string', enum: ['canvi', 'permut', 'baixa', 'vacances', 'altres'] },
          icon:    { type: 'string', example: 'fa-exchange-alt' },
          title:   { type: 'string', example: 'Canvi de torn' },
          detail:  { type: 'string', example: '22 abr 2026 · Matí' },
          comment: { type: 'string', example: 'Cita mèdica personal' },
          date:    { type: 'string', example: '22 abr. 2026' },
          status:  { type: 'string', enum: ['pendent', 'aprovada', 'rebutjada'] },
          estat:   { type: 'string', enum: ['PENDENT', 'APROVADA', 'REBUTJADA'] },
          metge_solicitant_id: { type: 'string' },
          metge_receptor_id:   { type: 'string', nullable: true }
        }
      },

      SolicitudEntrant: {
        type: 'object',
        properties: {
          id:     { type: 'string' },
          from:   { type: 'string', example: 'Dra. Anna Vidal' },
          avatar: { type: 'string', format: 'uri' },
          type:   { type: 'string', example: 'permut' },
          icon:   { type: 'string', example: 'fa-people-arrows' },
          title:  { type: 'string', example: 'Permuta de torn' },
          detail: { type: 'string', example: 'Torn: Matí' },
          date:   { type: 'string', example: '20 abr. 2026' }
        }
      },

      SolicitudInput: {
        type: 'object',
        required: ['tipus', 'tornAfectat', 'metge_solicitant_id'],
        properties: {
          tipus: {
            type: 'string',
            enum: ['CANVI_TORN', 'PERMUTA', 'BAIXA', 'VACANCES', 'ALTRES'],
            example: 'CANVI_TORN'
          },
          dataInici:           { type: 'string', format: 'date', example: '2026-04-25' },
          dataFinal:           { type: 'string', format: 'date', example: '2026-04-26', nullable: true },
          tornAfectat: {
            type: 'string',
            enum: ['MATI', 'TARDA', 'NIT', 'GUARDIA', 'LLIURE', 'BAIXA'],
            example: 'MATI'
          },
          motiu:               { type: 'string', example: 'Cita mèdica personal' },
          metge_solicitant_id: { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d0e' },
          metge_receptor_id:   { type: 'string', nullable: true },
          torn_ofert_id:       { type: 'string', nullable: true },
          torn_demanat_id:     { type: 'string', nullable: true }
        }
      },

      // ── Notificació ────────────────────────────────────────────────────────
      Notificacio: {
        type: 'object',
        properties: {
          id:     { type: 'string', example: '664a1b2c3d4e5f6a7b8c9d12' },
          type:   { type: 'string', enum: ['info', 'warning', 'success', 'danger'] },
          icon:   { type: 'string', example: 'fa-info-circle' },
          title:  { type: 'string', example: 'Torn assignat' },
          desc:   { type: 'string', example: 'Se t\'ha assignat el torn de matí del dia 25 d\'abril.' },
          time:   { type: 'string', example: 'Fa 2 hores' },
          unread: { type: 'boolean', example: true }
        }
      },

      // ── Genèrics ───────────────────────────────────────────────────────────
      OkResponse: {
        type: 'object',
        properties: { ok: { type: 'boolean', example: true } }
      },

      ErrorResponse: {
        type: 'object',
        properties: { error: { type: 'string', example: 'Descripció de l\'error' } }
      }
    },

    // ── Paràmetres reutilitzables ──────────────────────────────────────────
    parameters: {
      metgeIdPath: {
        name: 'id', in: 'path', required: true,
        schema: { type: 'string' },
        description: 'ObjectId MongoDB del metge',
        example: '664a1b2c3d4e5f6a7b8c9d0e'
      },
      solicitudIdPath: {
        name: 'id', in: 'path', required: true,
        schema: { type: 'string' },
        description: 'ObjectId MongoDB de la sol·licitud'
      },
      notificacioIdPath: {
        name: 'id', in: 'path', required: true,
        schema: { type: 'string' },
        description: 'ObjectId MongoDB de la notificació'
      }
    }
  },

  // ── Tags ─────────────────────────────────────────────────────────────────
  tags: [
    { name: 'Auth',         description: 'Registre i autenticació d\'usuaris' },
    { name: 'Metges',       description: 'Gestió del personal mèdic' },
    { name: 'Torns',        description: 'Torns i horaris' },
    { name: 'Casos',        description: 'Casos clínics assignats' },
    { name: 'Sol·licituds', description: 'Sol·licituds de canvi, permuta i baixes' },
    { name: 'Notificacions', description: 'Notificacions per al metge' },
    { name: 'Sistema',      description: 'Health check i estat del servei' }
  ],

  // ── Paths ─────────────────────────────────────────────────────────────────
  paths: {

    // ════════════════ AUTH ══════════════════════════════════════════════════
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Inici de sessió',
        description: 'Retorna un JWT vàlid 7 dies si les credencials són correctes.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['email', 'password'],
                properties: {
                  email:    { type: 'string', format: 'email', example: 'admin@medtorn.cat' },
                  password: { type: 'string', example: 'Admin1234!' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login correcte — retorna token JWT',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    token:  { type: 'string', example: 'eyJhbGc...' },
                    usuari: {
                      type: 'object',
                      properties: {
                        id:       { type: 'string' },
                        nom:      { type: 'string', example: 'Anna Puig' },
                        email:    { type: 'string' },
                        rol:      { type: 'string', enum: ['METGE', 'CAP_TORN'] },
                        metge_id: { type: 'string', nullable: true }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Falten camps', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          401: { description: 'Credencials incorrectes', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registre d\'un nou usuari',
        description: 'Crea un compte nou i retorna el JWT. Rol possible: `CAP_TORN` o `METGE`. Si és `METGE`, cal proporcionar `metge_id`.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object', required: ['nom', 'email', 'password', 'rol'],
                properties: {
                  nom:      { type: 'string', example: 'Dr. Nou Metge' },
                  email:    { type: 'string', format: 'email', example: 'nou.metge@hospital.cat' },
                  password: { type: 'string', minLength: 8, example: 'Contrasenya1!' },
                  rol:      { type: 'string', enum: ['METGE', 'CAP_TORN'], example: 'CAP_TORN' },
                  metge_id: { type: 'string', description: 'Obligatori si rol=METGE', nullable: true }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'Compte creat correctament' },
          400: { description: 'Validació fallida', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Correu o perfil ja registrat', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/api/auth/metges-disponibles': {
      get: {
        tags: ['Auth'],
        summary: 'Metges sense compte d\'usuari',
        description: 'Llista els metges que encara no tenen un compte associat (per al formulari de registre).',
        responses: {
          200: {
            description: 'Llista de metges disponibles per registrar',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id:          { type: 'string' },
                      nom:         { type: 'string' },
                      especialitat:{ type: 'string' },
                      numCollegiat:{ type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // ════════════════ METGES ════════════════════════════════════════════════
    '/api/metges': {
      get: {
        tags: ['Metges'],
        summary: 'Llista de metges',
        description: 'Retorna tots els metges amb els seus torns de la setmana actual. Admet filtres.',
        parameters: [
          { name: 'especialitat', in: 'query', schema: { type: 'string' }, description: 'Filtra per especialitat' },
          { name: 'subespecialitat', in: 'query', schema: { type: 'string' } },
          { name: 'unitat', in: 'query', schema: { type: 'string' }, description: 'Unitat (UCI, Urgències, etc.)' },
          {
            name: 'estat', in: 'query',
            schema: { type: 'string', enum: ['disponible', 'en-torn', 'baixa', 'vacances', 'DISPONIBLE', 'EN_TORN', 'BAIXA', 'VACANCES'] },
            description: 'Filtra per estat. Accepta valors frontend o DB'
          },
          { name: 'competencia', in: 'query', schema: { type: 'string' }, description: 'Nom d\'una competència' },
          { name: 'idioma', in: 'query', schema: { type: 'string' } },
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Cerca de text lliure (nom, especialitat, unitat, competència)' }
        ],
        responses: {
          200: {
            description: 'Llista de metges',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Metge' } } } }
          },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/api/metges/stats': {
      get: {
        tags: ['Metges'],
        summary: 'Estadístiques ràpides del dashboard',
        description: 'Retorna comptadors per a disponibles, en torn, de baixa i reemplaçaments.',
        responses: {
          200: {
            description: 'Estadístiques',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/MetgeStats' } } }
          },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/api/metges/{id}': {
      get: {
        tags: ['Metges'],
        summary: 'Detall d\'un metge',
        parameters: [{ $ref: '#/components/parameters/metgeIdPath' }],
        responses: {
          200: { description: 'Metge trobat', content: { 'application/json': { schema: { $ref: '#/components/schemas/Metge' } } } },
          400: { description: 'ID invàlid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Metge no trobat', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/api/metges/{id}/estat': {
      patch: {
        tags: ['Metges'],
        summary: 'Actualitzar l\'estat d\'un metge',
        parameters: [{ $ref: '#/components/parameters/metgeIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['estat'],
                properties: {
                  estat: {
                    type: 'string',
                    enum: ['DISPONIBLE', 'EN_TORN', 'BAIXA', 'VACANCES', 'OCUPAT', 'PAUSA'],
                    example: 'DISPONIBLE'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Estat actualitzat', content: { 'application/json': { schema: { $ref: '#/components/schemas/Metge' } } } },
          400: { description: 'Dades invàlides', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Metge no trobat', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    // ════════════════ TORNS ═════════════════════════════════════════════════
    '/api/torns': {
      get: {
        tags: ['Torns'],
        summary: 'Llista de torns',
        description: 'Filtrables per metge_id i/o rang de dates.',
        parameters: [
          { name: 'metge_id', in: 'query', schema: { type: 'string' }, description: 'ObjectId del metge' },
          { name: 'dataInici', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data d\'inici (inclusiva)', example: '2026-04-01' },
          { name: 'dataFinal', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data final (inclusiva)', example: '2026-04-30' }
        ],
        responses: {
          200: { description: 'Llista de torns', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Torn' } } } } },
          400: { description: 'Paràmetre invàlid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/api/torns/monthly/{metge_id}': {
      get: {
        tags: ['Torns'],
        summary: 'Torns mensuals d\'un metge (per al calendari)',
        description: 'Retorna un objecte `{ "YYYY-MM-DD": "M"|"T"|"N"|"G"|"L"|"B" }` per al mes indicat.',
        parameters: [
          { name: 'metge_id', in: 'path', required: true, schema: { type: 'string' }, description: 'ObjectId del metge' },
          { name: 'year',  in: 'query', schema: { type: 'integer', example: 2026 } },
          { name: 'month', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 12, example: 4 } }
        ],
        responses: {
          200: { description: 'Mapa de torns per data', content: { 'application/json': { schema: { $ref: '#/components/schemas/MonthlyShifts' } } } },
          400: { description: 'ID invàlid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    // ════════════════ CASOS ═════════════════════════════════════════════════
    '/api/casos': {
      get: {
        tags: ['Casos'],
        summary: 'Casos clínics',
        description: 'Retorna els casos del dia. Filtrable per metge_id.',
        parameters: [
          { name: 'metge_id', in: 'query', schema: { type: 'string' }, description: 'ObjectId del metge' }
        ],
        responses: {
          200: { description: 'Llista de casos', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Cas' } } } } },
          400: { description: 'metge_id invàlid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    // ════════════════ SOL·LICITUDS ══════════════════════════════════════════
    '/api/solicituds': {
      get: {
        tags: ['Sol·licituds'],
        summary: 'Sol·licituds d\'un metge',
        description: 'Retorna les sol·licituds enviades per un metge.',
        parameters: [
          { name: 'metge_id', in: 'query', required: true, schema: { type: 'string' }, description: 'ObjectId del metge solicitant' },
          { name: 'estat', in: 'query', schema: { type: 'string', enum: ['PENDENT', 'APROVADA', 'REBUTJADA'] } }
        ],
        responses: {
          200: { description: 'Llista de sol·licituds', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Solicitud' } } } } },
          400: { description: 'Paràmetre metge_id obligatori o invàlid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      },
      post: {
        tags: ['Sol·licituds'],
        summary: 'Crear nova sol·licitud',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SolicitudInput' } }
          }
        },
        responses: {
          201: { description: 'Sol·licitud creada', content: { 'application/json': { schema: { $ref: '#/components/schemas/Solicitud' } } } },
          400: { description: 'Dades invàlides', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/api/solicituds/entrants/{metge_id}': {
      get: {
        tags: ['Sol·licituds'],
        summary: 'Sol·licituds rebudes (permutes entrants)',
        description: 'Retorna les sol·licituds de permuta PENDENT adreçades a un metge.',
        parameters: [
          { name: 'metge_id', in: 'path', required: true, schema: { type: 'string' }, description: 'ObjectId del metge receptor' }
        ],
        responses: {
          200: { description: 'Sol·licituds entrants', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/SolicitudEntrant' } } } } },
          400: { description: 'ID invàlid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/api/solicituds/{id}/estat': {
      patch: {
        tags: ['Sol·licituds'],
        summary: 'Aprovar o rebutjar una sol·licitud',
        parameters: [{ $ref: '#/components/parameters/solicitudIdPath' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['estat'],
                properties: {
                  estat: { type: 'string', enum: ['APROVADA', 'REBUTJADA'], example: 'APROVADA' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Estat actualitzat', content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } } },
          400: { description: 'Dades invàlides', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Sol·licitud no trobada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    // ════════════════ NOTIFICACIONS ═════════════════════════════════════════
    '/api/notificacions': {
      get: {
        tags: ['Notificacions'],
        summary: 'Notificacions d\'un metge',
        description: 'Retorna les notificacions d\'un metge, ordenades per data descendent.',
        parameters: [
          { name: 'metge_id', in: 'query', required: true, schema: { type: 'string' }, description: 'ObjectId del metge' },
          { name: 'llegida', in: 'query', schema: { type: 'boolean' }, description: 'Filtra per llegida/no llegida' }
        ],
        responses: {
          200: { description: 'Llista de notificacions', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Notificacio' } } } } },
          400: { description: 'Paràmetre metge_id obligatori o invàlid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/api/notificacions/{id}/llegida': {
      patch: {
        tags: ['Notificacions'],
        summary: 'Marcar una notificació com a llegida',
        parameters: [{ $ref: '#/components/parameters/notificacioIdPath' }],
        responses: {
          200: { description: 'Notificació marcada com a llegida', content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } } },
          400: { description: 'ID invàlid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          404: { description: 'Notificació no trobada', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    '/api/notificacions/llegir-totes/{metge_id}': {
      patch: {
        tags: ['Notificacions'],
        summary: 'Marcar totes les notificacions d\'un metge com a llegides',
        parameters: [
          { name: 'metge_id', in: 'path', required: true, schema: { type: 'string' }, description: 'ObjectId del metge' }
        ],
        responses: {
          200: { description: 'Totes marcades com a llegides', content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } } },
          400: { description: 'metge_id invàlid', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          500: { description: 'Error intern', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
        }
      }
    },

    // ════════════════ SISTEMA ═══════════════════════════════════════════════
    '/api/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Health check',
        description: 'Comprova que el servidor i la connexió a MongoDB estan operatius.',
        responses: {
          200: {
            description: 'Servidor actiu',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status:    { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = spec;
