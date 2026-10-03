/**
 * Procedural Humanoid - Low-poly rigged character
 * P11 - Fallback character when CC0 assets unavailable
 */

import * as THREE from 'three';

export interface Bone {
  name: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  children: string[];
  length: number;
}

export interface Skeleton {
  bones: Map<string, Bone>;
  rootBone: string;
}

/**
 * Create procedural low-poly humanoid
 */
export function createProceduralHumanoid(): {
  mesh: THREE.SkinnedMesh;
  skeleton: THREE.Skeleton;
  bones: Map<string, THREE.Bone>;
} {
  // Create geometry
  const geometry = createHumanoidGeometry();
  
  // Create skeleton
  const bones = createHumanoidSkeleton();
  const skeleton = new THREE.Skeleton(Array.from(bones.values()));
  
  // Create material
  const material = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    roughness: 0.8,
    metalness: 0.1,
  });
  
  // Create skinned mesh
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.add(bones.get('root')!);
  mesh.bind(skeleton);
  
  return { mesh, skeleton, bones };
}

/**
 * Create humanoid geometry (low-poly)
 */
function createHumanoidGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  
  // Simple humanoid shape (box-based)
  const vertices: number[] = [];
  const normals: number[] = [];
  const skinIndices: number[] = [];
  const skinWeights: number[] = [];
  
  // Torso
  addBox(vertices, normals, skinIndices, skinWeights, 
    0, 1.0, 0, 0.4, 0.5, 0.25, 'spine', 1.0);
  
  // Head
  addBox(vertices, normals, skinIndices, skinWeights,
    0, 1.7, 0, 0.2, 0.25, 0.2, 'head', 1.0);
  
  // Left arm
  addBox(vertices, normals, skinIndices, skinWeights,
    -0.5, 1.1, 0, 0.15, 0.4, 0.15, 'leftUpperArm', 1.0);
  addBox(vertices, normals, skinIndices, skinWeights,
    -0.5, 0.6, 0, 0.12, 0.35, 0.12, 'leftLowerArm', 1.0);
  
  // Right arm
  addBox(vertices, normals, skinIndices, skinWeights,
    0.5, 1.1, 0, 0.15, 0.4, 0.15, 'rightUpperArm', 1.0);
  addBox(vertices, normals, skinIndices, skinWeights,
    0.5, 0.6, 0, 0.12, 0.35, 0.12, 'rightLowerArm', 1.0);
  
  // Left leg
  addBox(vertices, normals, skinIndices, skinWeights,
    -0.2, 0.4, 0, 0.18, 0.4, 0.18, 'leftUpperLeg', 1.0);
  addBox(vertices, normals, skinIndices, skinWeights,
    -0.2, 0.0, 0, 0.15, 0.4, 0.15, 'leftLowerLeg', 1.0);
  
  // Right leg
  addBox(vertices, normals, skinIndices, skinWeights,
    0.2, 0.4, 0, 0.18, 0.4, 0.18, 'rightUpperLeg', 1.0);
  addBox(vertices, normals, skinIndices, skinWeights,
    0.2, 0.0, 0, 0.15, 0.4, 0.15, 'rightLowerLeg', 1.0);
  
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(skinIndices, 4));
  geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(skinWeights, 4));
  
  return geometry;
}

/**
 * Add box to geometry with skinning
 */
function addBox(
  vertices: number[],
  normals: number[],
  skinIndices: number[],
  skinWeights: number[],
  x: number, y: number, z: number,
  width: number, height: number, depth: number,
  boneName: string,
  weight: number
): void {
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  
  // Get bone index
  const boneIndex = getBoneIndex(boneName);
  
  // 8 vertices of box
  const boxVertices = [
    [-hw, -hh, -hd], [hw, -hh, -hd], [hw, hh, -hd], [-hw, hh, -hd],
    [-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd]
  ];
  
  // Add vertices
  for (const v of boxVertices) {
    vertices.push((v[0] ?? 0) + x, (v[1] ?? 0) + y, (v[2] ?? 0) + z);
    
    // Simple normals (will be computed later)
    normals.push(0, 1, 0);
    
    // Skinning
    skinIndices.push(boneIndex, 0, 0, 0);
    skinWeights.push(weight, 0, 0, 0);
  }
  
  // Add faces (12 triangles for 6 faces)
  const indices = [
    0, 1, 2, 0, 2, 3, // front
    4, 6, 5, 4, 7, 6, // back
    0, 4, 5, 0, 5, 1, // bottom
    3, 2, 6, 3, 6, 7, // top
    0, 3, 7, 0, 7, 4, // left
    1, 5, 6, 1, 6, 2  // right
  ];
  
  // Note: In a real implementation, we'd add these to geometry.index
}

/**
 * Get bone index by name
 */
function getBoneIndex(name: string): number {
  const boneNames = [
    'root', 'spine', 'head',
    'leftUpperArm', 'leftLowerArm',
    'rightUpperArm', 'rightLowerArm',
    'leftUpperLeg', 'leftLowerLeg',
    'rightUpperLeg', 'rightLowerLeg'
  ];
  return boneNames.indexOf(name);
}

/**
 * Create humanoid skeleton
 */
function createHumanoidSkeleton(): Map<string, THREE.Bone> {
  const bones = new Map<string, THREE.Bone>();
  
  // Root
  const root = new THREE.Bone();
  root.name = 'root';
  root.position.set(0, 0, 0);
  bones.set('root', root);
  
  // Spine
  const spine = new THREE.Bone();
  spine.name = 'spine';
  spine.position.set(0, 0.8, 0);
  root.add(spine);
  bones.set('spine', spine);
  
  // Head
  const head = new THREE.Bone();
  head.name = 'head';
  head.position.set(0, 0.5, 0);
  spine.add(head);
  bones.set('head', head);
  
  // Left arm
  const leftUpperArm = new THREE.Bone();
  leftUpperArm.name = 'leftUpperArm';
  leftUpperArm.position.set(-0.4, 0.4, 0);
  spine.add(leftUpperArm);
  bones.set('leftUpperArm', leftUpperArm);
  
  const leftLowerArm = new THREE.Bone();
  leftLowerArm.name = 'leftLowerArm';
  leftLowerArm.position.set(0, -0.4, 0);
  leftUpperArm.add(leftLowerArm);
  bones.set('leftLowerArm', leftLowerArm);
  
  // Right arm
  const rightUpperArm = new THREE.Bone();
  rightUpperArm.name = 'rightUpperArm';
  rightUpperArm.position.set(0.4, 0.4, 0);
  spine.add(rightUpperArm);
  bones.set('rightUpperArm', rightUpperArm);
  
  const rightLowerArm = new THREE.Bone();
  rightLowerArm.name = 'rightLowerArm';
  rightLowerArm.position.set(0, -0.4, 0);
  rightUpperArm.add(rightLowerArm);
  bones.set('rightLowerArm', rightLowerArm);
  
  // Left leg
  const leftUpperLeg = new THREE.Bone();
  leftUpperLeg.name = 'leftUpperLeg';
  leftUpperLeg.position.set(-0.15, 0, 0);
  root.add(leftUpperLeg);
  bones.set('leftUpperLeg', leftUpperLeg);
  
  const leftLowerLeg = new THREE.Bone();
  leftLowerLeg.name = 'leftLowerLeg';
  leftLowerLeg.position.set(0, -0.4, 0);
  leftUpperLeg.add(leftLowerLeg);
  bones.set('leftLowerLeg', leftLowerLeg);
  
  // Right leg
  const rightUpperLeg = new THREE.Bone();
  rightUpperLeg.name = 'rightUpperLeg';
  rightUpperLeg.position.set(0.15, 0, 0);
  root.add(rightUpperLeg);
  bones.set('rightUpperLeg', rightUpperLeg);
  
  const rightLowerLeg = new THREE.Bone();
  rightLowerLeg.name = 'rightLowerLeg';
  rightLowerLeg.position.set(0, -0.4, 0);
  rightUpperLeg.add(rightLowerLeg);
  bones.set('rightLowerLeg', rightLowerLeg);
  
  return bones;
}

/**
 * Apply pose to skeleton
 */
export function applyPose(
  bones: Map<string, THREE.Bone>,
  pose: Record<string, { rotation?: THREE.Euler; position?: THREE.Vector3 }>
): void {
  for (const [boneName, transform] of Object.entries(pose)) {
    const bone = bones.get(boneName);
    if (!bone) continue;
    
    if (transform.rotation) {
      bone.rotation.copy(transform.rotation);
    }
    if (transform.position) {
      bone.position.copy(transform.position);
    }
  }
}

/**
 * Reset skeleton to T-pose
 */
export function resetToTPose(bones: Map<string, THREE.Bone>): void {
  for (const bone of bones.values()) {
    bone.rotation.set(0, 0, 0);
  }
}
