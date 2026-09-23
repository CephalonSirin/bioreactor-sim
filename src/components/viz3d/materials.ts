import * as THREE from 'three'

/**
 * Reused physically based materials for the vessel hardware. Created once
 * per module and shared by every mesh; the environment map supplies the
 * reflections that make the stainless steel read as metal.
 */
export const MAT = {
  steel: new THREE.MeshStandardMaterial({ color: '#c9d4d4', metalness: 1, roughness: 0.24, envMapIntensity: 1.1 }),
  brushed: new THREE.MeshStandardMaterial({ color: '#a9b7b8', metalness: 1, roughness: 0.42, envMapIntensity: 0.9 }),
  darkSteel: new THREE.MeshStandardMaterial({ color: '#34464a', metalness: 0.85, roughness: 0.38, envMapIntensity: 0.8 }),
  anodized: new THREE.MeshStandardMaterial({ color: '#1a2629', metalness: 0.7, roughness: 0.34, envMapIntensity: 0.9 }),
  housing: new THREE.MeshStandardMaterial({ color: '#dfe6e5', metalness: 0.1, roughness: 0.45, envMapIntensity: 0.6 }),
  rubber: new THREE.MeshStandardMaterial({ color: '#0d1416', metalness: 0, roughness: 0.75 }),
  cable: new THREE.MeshStandardMaterial({ color: '#141c1f', metalness: 0.1, roughness: 0.5 }),
  capBlue: new THREE.MeshStandardMaterial({ color: '#2f6fb7', metalness: 0.05, roughness: 0.4 }),
  capAmber: new THREE.MeshStandardMaterial({ color: '#b8842a', metalness: 0.1, roughness: 0.4 }),
  filter: new THREE.MeshStandardMaterial({ color: '#e9f0ee', metalness: 0, roughness: 0.6 }),
  screen: new THREE.MeshStandardMaterial({ color: '#061012', metalness: 0.2, roughness: 0.2, emissive: '#0b2a2a', emissiveIntensity: 1 }),
  glassSolid: new THREE.MeshStandardMaterial({
    color: '#bfe9e2',
    metalness: 0,
    roughness: 0.05,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    envMapIntensity: 1.4,
  }),
}

export function ledMaterial(color: string) {
  return new THREE.MeshBasicMaterial({ color, toneMapped: false })
}
