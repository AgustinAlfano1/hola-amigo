export type Brand = 'Ford' | 'Chevrolet' | 'Fiat' | 'Volkswagen' | 'Renault' | 'Peugeot' | 'Toyota';
export type Category = 'Motor' | 'Frenos' | 'Suspensión' | 'Electricidad' | 'Carrocería' | 'Filtros';
export type SubCategory = string;

export interface Product {
  id: string;
  name: string;
  brand: Brand;
  category: Category;
  subCategory: SubCategory;
  price: number;
  image: string;
  inStock: boolean;
  description: string;
}

export const brands: Brand[] = ['Ford', 'Chevrolet', 'Fiat', 'Volkswagen', 'Renault', 'Peugeot', 'Toyota'];

export const categories: Category[] = ['Motor', 'Frenos', 'Suspensión', 'Electricidad', 'Carrocería', 'Filtros'];

export const subCategories: Record<Category, SubCategory[]> = {
  Motor: ['Correas', 'Bujías', 'Juntas', 'Válvulas', 'Bombas de agua'],
  Frenos: ['Pastillas', 'Discos', 'Campanas', 'Cilindros', 'Líquido de frenos'],
  Suspensión: ['Amortiguadores', 'Espirales', 'Rótulas', 'Bujes', 'Barras estabilizadoras'],
  Electricidad: ['Alternadores', 'Baterías', 'Bobinas', 'Sensores', 'Cables'],
  Carrocería: ['Paragolpes', 'Ópticas', 'Espejos', 'Guardabarros', 'Capots'],
  Filtros: ['Aire', 'Aceite', 'Combustible', 'Habitáculo', 'Partículas'],
};

export const products: Product[] = [
  { id: '1', name: 'Pastillas de Freno Delanteras', brand: 'Ford', category: 'Frenos', subCategory: 'Pastillas', price: 18500, image: '🔧', inStock: true, description: 'Pastillas de freno delanteras para Ford Focus / Fiesta' },
  { id: '2', name: 'Amortiguador Trasero', brand: 'Chevrolet', category: 'Suspensión', subCategory: 'Amortiguadores', price: 45000, image: '🔧', inStock: true, description: 'Amortiguador trasero para Chevrolet Cruze' },
  { id: '3', name: 'Filtro de Aceite', brand: 'Fiat', category: 'Filtros', subCategory: 'Aceite', price: 4200, image: '🔧', inStock: true, description: 'Filtro de aceite para Fiat Cronos / Argo' },
  { id: '4', name: 'Bobina de Encendido', brand: 'Volkswagen', category: 'Electricidad', subCategory: 'Bobinas', price: 32000, image: '🔧', inStock: false, description: 'Bobina de encendido para VW Gol / Voyage' },
  { id: '5', name: 'Kit de Distribución', brand: 'Renault', category: 'Motor', subCategory: 'Correas', price: 67000, image: '🔧', inStock: true, description: 'Kit completo de distribución Renault Sandero / Logan' },
  { id: '6', name: 'Óptica Delantera Izquierda', brand: 'Peugeot', category: 'Carrocería', subCategory: 'Ópticas', price: 89000, image: '🔧', inStock: true, description: 'Óptica delantera izquierda Peugeot 208' },
  { id: '7', name: 'Disco de Freno Ventilado', brand: 'Toyota', category: 'Frenos', subCategory: 'Discos', price: 28500, image: '🔧', inStock: true, description: 'Disco de freno ventilado Toyota Hilux' },
  { id: '8', name: 'Bujías Iridium x4', brand: 'Ford', category: 'Motor', subCategory: 'Bujías', price: 22000, image: '🔧', inStock: true, description: 'Juego de 4 bujías Iridium Ford EcoSport' },
  { id: '9', name: 'Espiral Delantero', brand: 'Chevrolet', category: 'Suspensión', subCategory: 'Espirales', price: 35000, image: '🔧', inStock: true, description: 'Espiral delantero Chevrolet Onix / Prisma' },
  { id: '10', name: 'Filtro de Aire', brand: 'Fiat', category: 'Filtros', subCategory: 'Aire', price: 5800, image: '🔧', inStock: true, description: 'Filtro de aire Fiat Palio / Siena' },
  { id: '11', name: 'Sensor de Temperatura', brand: 'Volkswagen', category: 'Electricidad', subCategory: 'Sensores', price: 15000, image: '🔧', inStock: true, description: 'Sensor de temperatura motor VW Polo' },
  { id: '12', name: 'Paragolpes Delantero', brand: 'Renault', category: 'Carrocería', subCategory: 'Paragolpes', price: 125000, image: '🔧', inStock: false, description: 'Paragolpes delantero Renault Duster' },
  { id: '13', name: 'Bomba de Agua', brand: 'Peugeot', category: 'Motor', subCategory: 'Bombas de agua', price: 42000, image: '🔧', inStock: true, description: 'Bomba de agua Peugeot 308 / 408' },
  { id: '14', name: 'Pastillas de Freno Traseras', brand: 'Toyota', category: 'Frenos', subCategory: 'Pastillas', price: 16500, image: '🔧', inStock: true, description: 'Pastillas de freno traseras Toyota Corolla' },
  { id: '15', name: 'Alternador', brand: 'Ford', category: 'Electricidad', subCategory: 'Alternadores', price: 95000, image: '🔧', inStock: true, description: 'Alternador Ford Ranger' },
  { id: '16', name: 'Rótula de Dirección', brand: 'Chevrolet', category: 'Suspensión', subCategory: 'Rótulas', price: 12000, image: '🔧', inStock: true, description: 'Rótula de dirección Chevrolet S10' },
  { id: '17', name: 'Junta de Tapa de Cilindros', brand: 'Fiat', category: 'Motor', subCategory: 'Juntas', price: 8500, image: '🔧', inStock: true, description: 'Junta de tapa de cilindros Fiat Uno / Fire' },
  { id: '18', name: 'Espejo Retrovisor Derecho', brand: 'Volkswagen', category: 'Carrocería', subCategory: 'Espejos', price: 38000, image: '🔧', inStock: true, description: 'Espejo retrovisor derecho eléctrico VW Amarok' },
  { id: '19', name: 'Filtro de Combustible', brand: 'Renault', category: 'Filtros', subCategory: 'Combustible', price: 7200, image: '🔧', inStock: true, description: 'Filtro de combustible Renault Kangoo' },
  { id: '20', name: 'Cilindro de Freno', brand: 'Peugeot', category: 'Frenos', subCategory: 'Cilindros', price: 19000, image: '🔧', inStock: true, description: 'Cilindro de freno trasero Peugeot Partner' },
];
