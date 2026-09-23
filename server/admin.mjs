import { openDatabase } from './database.mjs';
const [command, email] = process.argv.slice(2);
if (!['promote', 'demote'].includes(command) || !email) {
  console.error('Usage: node server/admin.mjs promote|demote adresse@email.tld'); process.exit(1);
}
const db = openDatabase(process.env.DATABASE_PATH || 'server/data/learnai.sqlite');
const result = db.prepare('UPDATE users SET role=? WHERE email=?').run(command === 'promote' ? 'admin' : 'member', email.toLowerCase());
if (!result.changes) { console.error('Compte introuvable : inscrivez-le d’abord dans l’application.'); process.exitCode = 1; }
else console.log('Rôle mis à jour.');
db.close();
