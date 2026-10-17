import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import AppDataSource from './data-source';
import { User } from './modules/users/user.entity';
import { Tema } from './modules/temas/tema.entity';

export const TEMAS_INICIALES = [
  ['IA generativa y prompt engineering', 'Modelos generativos, prompting y aplicaciones'],
  ['Machine learning y ciencia de datos', 'Algoritmos, modelos predictivos y análisis de datos'],
  ['Ciberseguridad y hacking ético', 'Seguridad ofensiva/defensiva y buenas prácticas'],
  ['Computación en la nube', 'AWS, Azure, GCP y arquitecturas cloud'],
  ['DevOps y automatización', 'CI/CD, contenedores e infraestructura como código'],
  ['Desarrollo web full stack', 'Frontend, backend y APIs modernas'],
  ['Desarrollo de apps móviles', 'Android, iOS, Flutter y React Native'],
  ['IoT y sistemas embebidos', 'Sensores, microcontroladores y edge computing'],
  ['Big data y analítica de negocios', 'Pipelines de datos y BI'],
  ['Blockchain y finanzas digitales', 'Contratos inteligentes y criptoactivos'],
  ['Realidad virtual y aumentada', 'Experiencias inmersivas y 3D'],
  ['Desarrollo de videojuegos', 'Motores, diseño y programación de juegos'],
  ['Robótica', 'Automatización física y control'],
  ['Diseño UX/UI', 'Experiencia de usuario e interfaces'],
  ['Pruebas de software y QA', 'Testing manual y automatizado'],
  ['Low-code/No-code y RPA', 'Automatización de procesos sin código'],
  ['Metodologías ágiles y gestión de proyectos TI', 'Scrum, Kanban y liderazgo técnico'],
  ['Emprendimiento tecnológico', 'Startups, modelo de negocio y pitch'],
  ['Certificaciones internacionales', 'Preparación para certificaciones de la industria'],
  ['Inglés técnico', 'Inglés aplicado a tecnología y empleabilidad'],
];

async function main() {
  await AppDataSource.initialize();
  await AppDataSource.runMigrations();
  const users = AppDataSource.getRepository(User);
  const temas = AppDataSource.getRepository(Tema);

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@unipacifico.edu.co').toLowerCase();
  const adminPass = process.env.ADMIN_PASSWORD || 'Admin123*';
  let admin = await users.findOne({ where: { correo: adminEmail } });
  const baseYaInicializada = !!admin;
  if (!admin) {
    admin = await users.save(
      users.create({
        correo: adminEmail,
        nombre: process.env.ADMIN_NOMBRE || 'Proyección Social',
        passwordHash: await bcrypt.hash(adminPass, 10),
        passwordPlano: adminPass,
        proveedorAuth: 'local',
        semestre: 1,
        rol: 'ADMIN',
        aceptoDatosAt: new Date(),
      }),
    );
    // eslint-disable-next-line no-console
    console.log(`Admin creado: ${adminEmail}`);
  } else {
    if (!admin.passwordPlano) {
      admin.passwordPlano = adminPass;
      await users.save(admin);
    }
    // eslint-disable-next-line no-console
    console.log(`Admin ya existe: ${adminEmail}`);
  }

  const estEmail = (process.env.ESTUDIANTE_EMAIL || 'estudiante@unipacifico.edu.co').toLowerCase();
  const estPass = process.env.ESTUDIANTE_PASSWORD || 'Estudiante123*';
  const estSemestre = Math.min(9, Math.max(1, Number(process.env.ESTUDIANTE_SEMESTRE || 5)));
  const existeEst = await users.findOne({ where: { correo: estEmail } });
  if (!existeEst) {
    await users.save(
      users.create({
        correo: estEmail,
        nombre: process.env.ESTUDIANTE_NOMBRE || 'Estudiante Demo',
        passwordHash: await bcrypt.hash(estPass, 10),
        passwordPlano: estPass,
        proveedorAuth: 'local',
        semestre: estSemestre,
        rol: 'ESTUDIANTE',
        aceptoDatosAt: new Date(),
      }),
    );
    // eslint-disable-next-line no-console
    console.log(`Estudiante demo creado: ${estEmail} (semestre ${estSemestre})`);
  } else {
    if (!existeEst.passwordPlano) {
      existeEst.passwordPlano = estPass;
      await users.save(existeEst);
    }
    // eslint-disable-next-line no-console
    console.log(`Estudiante demo ya existe: ${estEmail}`);
  }

  if (!baseYaInicializada) {
    for (const [nombre, descripcion] of TEMAS_INICIALES) {
      const existe = await temas.findOne({ where: { nombre } });
      if (!existe) await temas.save(temas.create({ nombre, descripcion, activo: true }));
    }
    // eslint-disable-next-line no-console
    console.log(`Temas iniciales creados: ${TEMAS_INICIALES.length}`);
  } else {
    // eslint-disable-next-line no-console
    console.log('Base de datos ya inicializada: respetando temas eliminados por el administrador.');
  }
  await AppDataSource.destroy();
  process.exit(0);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
