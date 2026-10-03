/**
 * Interior System
 * P13 - Enterable building interiors as sub-cells
 */

import * as THREE from 'three';

export enum InteriorType {
  TAVERN = 'tavern',
  SMITHY = 'smithy',
  CHURCH = 'church',
  CASTLE_KEEP = 'castle_keep',
}

export interface InteriorConfig {
  type: InteriorType;
  size: { width: number; height: number; depth: number };
  hasMultipleFloors: boolean;
  floorCount: number;
}

export const INTERIOR_SCHEMAS: Record<InteriorType, InteriorConfig> = {
  [InteriorType.TAVERN]: {
    type: InteriorType.TAVERN,
    size: { width: 10, height: 4, depth: 12 },
    hasMultipleFloors: false,
    floorCount: 1,
  },
  [InteriorType.SMITHY]: {
    type: InteriorType.SMITHY,
    size: { width: 8, height: 4, depth: 10 },
    hasMultipleFloors: false,
    floorCount: 1,
  },
  [InteriorType.CHURCH]: {
    type: InteriorType.CHURCH,
    size: { width: 12, height: 8, depth: 20 },
    hasMultipleFloors: false,
    floorCount: 1,
  },
  [InteriorType.CASTLE_KEEP]: {
    type: InteriorType.CASTLE_KEEP,
    size: { width: 25, height: 12, depth: 25 },
    hasMultipleFloors: true,
    floorCount: 3,
  },
};

export class InteriorSystem {
  /**
   * Generate interior mesh
   */
  generateInterior(type: InteriorType): THREE.Group {
    const group = new THREE.Group();
    group.name = `interior_${type}`;

    const config = INTERIOR_SCHEMAS[type];

    switch (type) {
      case InteriorType.TAVERN:
        this.generateTavernInterior(group, config);
        break;
      case InteriorType.SMITHY:
        this.generateSmithyInterior(group, config);
        break;
      case InteriorType.CHURCH:
        this.generateChurchInterior(group, config);
        break;
      case InteriorType.CASTLE_KEEP:
        this.generateCastleKeepInterior(group, config);
        break;
    }

    return group;
  }

  /**
   * Generate tavern interior
   */
  private generateTavernInterior(group: THREE.Group, config: InteriorConfig): void {
    const { width, height, depth } = config.size;

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(width, depth);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.8,
    });

    // Back wall
    const backWallGeometry = new THREE.BoxGeometry(width, height, 0.3);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, height / 2, -depth / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);

    // Side walls
    const sideWallGeometry = new THREE.BoxGeometry(0.3, height, depth);
    
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-width / 2, height / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(width / 2, height / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(width, depth);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.9,
    });
    const ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = height;
    ceiling.receiveShadow = true;
    group.add(ceiling);

    // Bar counter
    const barGeometry = new THREE.BoxGeometry(width * 0.6, 1.2, 0.8);
    const barMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.7,
    });
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.set(-width * 0.2, 0.6, -depth * 0.3);
    bar.castShadow = true;
    bar.receiveShadow = true;
    group.add(bar);

    // Tables
    const tableGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 8);
    const tableMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.8,
    });

    const tablePositions = [
      { x: width * 0.2, z: depth * 0.2 },
      { x: width * 0.2, z: -depth * 0.1 },
      { x: -width * 0.2, z: depth * 0.3 },
    ];

    for (const pos of tablePositions) {
      const table = new THREE.Mesh(tableGeometry, tableMaterial);
      table.position.set(pos.x, 0.4, pos.z);
      table.castShadow = true;
      table.receiveShadow = true;
      group.add(table);
    }

    // Lighting
    const light = new THREE.PointLight(0xffaa55, 1.5, 15);
    light.position.set(0, height - 0.5, 0);
    light.castShadow = true;
    group.add(light);
  }

  /**
   * Generate smithy interior
   */
  private generateSmithyInterior(group: THREE.Group, config: InteriorConfig): void {
    const { width, height, depth } = config.size;

    // Floor (stone)
    const floorGeometry = new THREE.PlaneGeometry(width, depth);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x606060,
      roughness: 1.0,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9,
    });

    const wallGeometry = new THREE.BoxGeometry(width, height, 0.3);
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.set(0, height / 2, -depth / 2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    group.add(backWall);

    // Forge
    const forgeGeometry = new THREE.BoxGeometry(2, 1.5, 2);
    const forgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x404040,
      roughness: 0.8,
    });
    const forge = new THREE.Mesh(forgeGeometry, forgeMaterial);
    forge.position.set(-width * 0.3, 0.75, -depth * 0.3);
    forge.castShadow = true;
    forge.receiveShadow = true;
    group.add(forge);

    // Anvil
    const anvilGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.5);
    const anvilMaterial = new THREE.MeshStandardMaterial({
      color: 0x303030,
      roughness: 0.6,
      metalness: 0.8,
    });
    const anvil = new THREE.Mesh(anvilGeometry, anvilMaterial);
    anvil.position.set(width * 0.2, 0.3, 0);
    anvil.castShadow = true;
    anvil.receiveShadow = true;
    group.add(anvil);

    // Forge light
    const forgeLight = new THREE.PointLight(0xff4400, 2, 8);
    forgeLight.position.set(-width * 0.3, 1.5, -depth * 0.3);
    forgeLight.castShadow = true;
    group.add(forgeLight);
  }

  /**
   * Generate church interior
   */
  private generateChurchInterior(group: THREE.Group, config: InteriorConfig): void {
    const { width, height, depth } = config.size;

    // Floor (stone tiles)
    const floorGeometry = new THREE.PlaneGeometry(width, depth);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xa0a0a0,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      roughness: 0.7,
    });

    const sideWallGeometry = new THREE.BoxGeometry(0.3, height, depth);
    
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-width / 2, height / 2, 0);
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(width / 2, height / 2, 0);
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // Altar
    const altarGeometry = new THREE.BoxGeometry(3, 1, 1.5);
    const altarMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4c4a8,
      roughness: 0.6,
    });
    const altar = new THREE.Mesh(altarGeometry, altarMaterial);
    altar.position.set(0, 0.5, -depth * 0.4);
    altar.castShadow = true;
    altar.receiveShadow = true;
    group.add(altar);

    // Pews
    const pewGeometry = new THREE.BoxGeometry(width * 0.8, 0.8, 0.5);
    const pewMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.8,
    });

    for (let i = 0; i < 4; i++) {
      const pew = new THREE.Mesh(pewGeometry, pewMaterial);
      pew.position.set(0, 0.4, -depth * 0.2 + i * 2);
      pew.castShadow = true;
      pew.receiveShadow = true;
      group.add(pew);
    }

    // Lighting
    const light = new THREE.PointLight(0xffffee, 1, 20);
    light.position.set(0, height - 1, 0);
    light.castShadow = true;
    group.add(light);
  }

  /**
   * Generate castle keep interior
   */
  private generateCastleKeepInterior(group: THREE.Group, config: InteriorConfig): void {
    const { width, height, depth } = config.size;

    // Generate each floor
    for (let floor = 0; floor < config.floorCount; floor++) {
      const floorHeight = height / config.floorCount;
      const floorGroup = new THREE.Group();
      floorGroup.position.y = floor * floorHeight;

      // Floor
      const floorGeometry = new THREE.PlaneGeometry(width, depth);
      const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.9,
      });
      const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
      floorMesh.rotation.x = -Math.PI / 2;
      floorMesh.receiveShadow = true;
      floorGroup.add(floorMesh);

      // Walls
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x606060,
        roughness: 0.8,
      });

      const wallGeometry = new THREE.BoxGeometry(width, floorHeight, 0.5);
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.set(0, floorHeight / 2, -depth / 2);
      wall.castShadow = true;
      wall.receiveShadow = true;
      floorGroup.add(wall);

      // Add throne on ground floor
      if (floor === 0) {
        const throneGeometry = new THREE.BoxGeometry(2, 3, 2);
        const throneMaterial = new THREE.MeshStandardMaterial({
          color: 0xc8a96e,
          roughness: 0.5,
          metalness: 0.3,
        });
        const throne = new THREE.Mesh(throneGeometry, throneMaterial);
        throne.position.set(0, 1.5, -depth * 0.4);
        throne.castShadow = true;
        throne.receiveShadow = true;
        floorGroup.add(throne);
      }

      group.add(floorGroup);
    }
  }

  /**
   * Get interior config
   */
  getInteriorConfig(type: InteriorType): InteriorConfig {
    return INTERIOR_SCHEMAS[type];
  }
}
