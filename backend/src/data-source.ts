import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './modules/users/user.entity';
import { Periodo } from './modules/periodos/periodo.entity';
import { Tema } from './modules/temas/tema.entity';
import { Respuesta, RespuestaTema } from './modules/encuestas/respuesta.entity';
import { Sugerencia } from './modules/encuestas/sugerencia.entity';
import { Capacitacion, CapacitacionSemestre } from './modules/capacitaciones/capacitacion.entity';
import { ClicCapacitacion } from './modules/capacitaciones/clic.entity';
import { RecordatorioEnviado } from './modules/recordatorios/recordatorio.entity';
import { PasswordReset } from './modules/auth/password-reset.entity';

dotenv.config({ path: '../.env' });
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'intereses_db',
  entities: [User, Periodo, Tema, Respuesta, RespuestaTema, Sugerencia, Capacitacion, CapacitacionSemestre, ClicCapacitacion, RecordatorioEnviado, PasswordReset],
  migrations: ['src/migrations/*{.ts,.js}'],
  synchronize: false,
});

export default AppDataSource;
