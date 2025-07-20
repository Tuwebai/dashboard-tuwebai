const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Desplegando reglas de Firestore...');

try {
  // Verificar que firebase CLI esté instalado
  execSync('firebase --version', { stdio: 'pipe' });
  
  // Verificar que el archivo de reglas existe
  const rulesPath = path.join(__dirname, 'firestore.rules');
  if (!fs.existsSync(rulesPath)) {
    console.error('❌ Archivo firestore.rules no encontrado');
    process.exit(1);
  }
  
  // Desplegar reglas
  console.log('📝 Desplegando reglas de seguridad...');
  execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
  
  console.log('✅ Reglas de Firestore desplegadas exitosamente');
  
} catch (error) {
  console.error('❌ Error desplegando reglas:', error.message);
  console.log('\n📋 Para desplegar manualmente:');
  console.log('1. Instala Firebase CLI: npm install -g firebase-tools');
  console.log('2. Inicia sesión: firebase login');
  console.log('3. Inicializa el proyecto: firebase init firestore');
  console.log('4. Despliega: firebase deploy --only firestore:rules');
} 