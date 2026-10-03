/**
 * Building Generator
 * P13 - Modular building generation from kit pieces
 */

import * as THREE from 'three';
import { BuildingType, BUILDING_SCHEMAS } from '../../content/settlements/schemas.js';
import type { Plot } from '../../content/settlements/schemas.js';

export class BuildingGenerator {
  /**
   * Generate building mesh for a plot
   */
  generate(plot: Plot): THREE.Group {
    const group = new THREE.Group();
    group.name = `building_${plot.id}`;

    const schema = BUILDING_SCHEMAS[plot.buildingType];

    switch (plot.buildingType) {
      case BuildingType.HOUSE:
        this.generateHouse(group, plot);
        break;
      case BuildingType.TAVERN:
        this.generateTavern(group, plot);
        break;
      case BuildingType.SMITHY:
        this.generateSmithy(group, plot);
        break;
      case BuildingType.MARKET:
        this.generateMarket(group, plot);
        break;
      case BuildingType.FARM:
        this.generateFarm(group, plot);
        break;
      case BuildingType.CHURCH:
        this.generateChurch(group, plot);
        break;
      case BuildingType.CASTLE_KEEP:
        this.generateCastleKeep(group, plot);
        break;
      case BuildingType.CASTLE_WALL:
        this.generateCastleWall(group, plot);
        break;
      case BuildingType.GATE:
        this.generateGate(group, plot);
        break;
      case BuildingType.BRIDGE:
        this.generateBridge(group, plot);
        break;
    }

    // Position and rotate
    group.position.set(plot.position.x, 0, plot.position.z);
    group.rotation.y = plot.rotation;

    return group;
  }

  /**
   * Generate house
   */
  private generateHouse(group: THREE.Group, plot: Plot): void {
    const { width, depth } = plot.size;

    // Base
    const baseGeometry = new THREE.BoxGeometry(width, 3, depth);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4c4a8,
      roughness: 0.8,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1.5;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Roof
    const roofGeometry = new THREE.ConeGeometry(
      Math.max(width, depth) * 0.7,
      2,
      4
    );
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 4;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);
  }

  /**
   * Generate tavern (larger, with sign)
   */
  private generateTavern(group: THREE.Group, plot: Plot): void {
    const { width, depth } = plot.size;

    // Base (larger)
    const baseGeometry = new THREE.BoxGeometry(width, 4, depth);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8b896,
      roughness: 0.8,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Roof
    const roofGeometry = new THREE.ConeGeometry(
      Math.max(width, depth) * 0.7,
      2.5,
      4
    );
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b3410,
      roughness: 0.9,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 5.25;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Sign
    const signGeometry = new THREE.BoxGeometry(2, 1, 0.1);
    const signMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.7,
    });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 3.5, depth / 2 + 0.1);
    sign.castShadow = true;
    group.add(sign);
  }

  /**
   * Generate smithy (with chimney)
   */
  private generateSmithy(group: THREE.Group, plot: Plot): void {
    const { width, depth } = plot.size;

    // Base
    const baseGeometry = new THREE.BoxGeometry(width, 3.5, depth);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.9,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = 1.75;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Roof
    const roofGeometry = new THREE.ConeGeometry(
      Math.max(width, depth) * 0.7,
      2,
      4
    );
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.9,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 4.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Chimney
    const chimneyGeometry = new THREE.BoxGeometry(1, 3, 1);
    const chimneyMaterial = new THREE.MeshStandardMaterial({
      color: 0x606060,
      roughness: 1.0,
    });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(width / 3, 5, 0);
    chimney.castShadow = true;
    group.add(chimney);
  }

  /**
   * Generate market (open structure)
   */
  private generateMarket(group: THREE.Group, plot: Plot): void {
    const { width, depth } = plot.size;

    // Posts
    const postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 4, 8);
    const postMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.8,
    });

    const positions = [
      [-width / 2, -depth / 2],
      [width / 2, -depth / 2],
      [-width / 2, depth / 2],
      [width / 2, depth / 2],
    ];

    for (const [x, z] of positions) {
      const post = new THREE.Mesh(postGeometry, postMaterial);
      post.position.set(x!, 2, z!);
      post.castShadow = true;
      group.add(post);
    }

    // Canopy
    const canopyGeometry = new THREE.BoxGeometry(width, 0.2, depth);
    const canopyMaterial = new THREE.MeshStandardMaterial({
      color: 0xc8a96e,
      roughness: 0.7,
    });
    const canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
    canopy.position.y = 4;
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    group.add(canopy);
  }

  /**
   * Generate farm (fields + barn)
   */
  private generateFarm(group: THREE.Group, plot: Plot): void {
    const { width, depth } = plot.size;

    // Barn
    const barnGeometry = new THREE.BoxGeometry(width * 0.4, 4, depth * 0.4);
    const barnMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b6f47,
      roughness: 0.9,
    });
    const barn = new THREE.Mesh(barnGeometry, barnMaterial);
    barn.position.set(-width * 0.3, 2, 0);
    barn.castShadow = true;
    barn.receiveShadow = true;
    group.add(barn);

    // Barn roof
    const roofGeometry = new THREE.ConeGeometry(
      Math.max(width * 0.4, depth * 0.4) * 0.7,
      2,
      4
    );
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b3410,
      roughness: 0.9,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(-width * 0.3, 5, 0);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);

    // Field (flat plane)
    const fieldGeometry = new THREE.PlaneGeometry(width * 0.5, depth * 0.8);
    const fieldMaterial = new THREE.MeshStandardMaterial({
      color: 0x7cb342,
      roughness: 1.0,
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.rotation.x = -Math.PI / 2;
    field.position.set(width * 0.2, 0.01, 0);
    field.receiveShadow = true;
    group.add(field);
  }

  /**
   * Generate church
   */
  private generateChurch(group: THREE.Group, plot: Plot): void {
    const { width, depth } = plot.size;

    // Main building
    const mainGeometry = new THREE.BoxGeometry(width, 5, depth);
    const mainMaterial = new THREE.MeshStandardMaterial({
      color: 0xe8e8e8,
      roughness: 0.7,
    });
    const main = new THREE.Mesh(mainGeometry, mainMaterial);
    main.position.y = 2.5;
    main.castShadow = true;
    main.receiveShadow = true;
    group.add(main);

    // Tower
    const towerGeometry = new THREE.BoxGeometry(width * 0.4, 8, width * 0.4);
    const tower = new THREE.Mesh(towerGeometry, mainMaterial);
    tower.position.set(0, 4, -depth * 0.3);
    tower.castShadow = true;
    group.add(tower);

    // Spire
    const spireGeometry = new THREE.ConeGeometry(width * 0.25, 4, 8);
    const spireMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.6,
    });
    const spire = new THREE.Mesh(spireGeometry, spireMaterial);
    spire.position.set(0, 10, -depth * 0.3);
    spire.castShadow = true;
    group.add(spire);

    // Roof
    const roofGeometry = new THREE.ConeGeometry(
      Math.max(width, depth) * 0.7,
      3,
      4
    );
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b3410,
      roughness: 0.9,
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 6.5;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    group.add(roof);
  }

  /**
   * Generate castle keep
   */
  private generateCastleKeep(group: THREE.Group, plot: Plot): void {
    const { width, depth } = plot.size;

    // Main keep
    const keepGeometry = new THREE.BoxGeometry(width, 15, depth);
    const keepMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
    });
    const keep = new THREE.Mesh(keepGeometry, keepMaterial);
    keep.position.y = 7.5;
    keep.castShadow = true;
    keep.receiveShadow = true;
    group.add(keep);

    // Towers at corners
    const towerGeometry = new THREE.CylinderGeometry(3, 3, 20, 12);
    const towerPositions = [
      [-width / 2, -depth / 2],
      [width / 2, -depth / 2],
      [-width / 2, depth / 2],
      [width / 2, depth / 2],
    ];

    for (const [x, z] of towerPositions) {
      const tower = new THREE.Mesh(towerGeometry, keepMaterial);
      tower.position.set(x!, 10, z!);
      tower.castShadow = true;
      group.add(tower);

      // Tower roof
      const roofGeometry = new THREE.ConeGeometry(3.5, 5, 12);
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x6b3410,
        roughness: 0.9,
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.set(x!, 22.5, z!);
      roof.castShadow = true;
      group.add(roof);
    }
  }

  /**
   * Generate castle wall segment
   */
  private generateCastleWall(group: THREE.Group, plot: Plot): void {
    const { width, depth } = plot.size;

    const wallGeometry = new THREE.BoxGeometry(width, 8, depth);
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
    });
    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
    wall.position.y = 4;
    wall.castShadow = true;
    wall.receiveShadow = true;
    group.add(wall);

    // Battlements
    const battlementCount = Math.floor(width / 2);
    const battlementGeometry = new THREE.BoxGeometry(1, 1, depth);
    
    for (let i = 0; i < battlementCount; i++) {
      const battlement = new THREE.Mesh(battlementGeometry, wallMaterial);
      battlement.position.set(
        -width / 2 + i * 2 + 1,
        8.5,
        0
      );
      battlement.castShadow = true;
      group.add(battlement);
    }
  }

  /**
   * Generate gate
   */
  private generateGate(group: THREE.Group, plot: Plot): void {
    const { width, depth } = plot.size;

    // Gate posts
    const postGeometry = new THREE.BoxGeometry(2, 6, depth);
    const postMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      roughness: 0.8,
    });

    const leftPost = new THREE.Mesh(postGeometry, postMaterial);
    leftPost.position.set(-width / 2 + 1, 3, 0);
    leftPost.castShadow = true;
    group.add(leftPost);

    const rightPost = new THREE.Mesh(postGeometry, postMaterial);
    rightPost.position.set(width / 2 - 1, 3, 0);
    rightPost.castShadow = true;
    group.add(rightPost);

    // Arch
    const archGeometry = new THREE.BoxGeometry(width, 2, depth);
    const arch = new THREE.Mesh(archGeometry, postMaterial);
    arch.position.y = 7;
    arch.castShadow = true;
    group.add(arch);
  }

  /**
   * Generate bridge
   */
  private generateBridge(group: THREE.Group, plot: Plot): void {
    const { width, depth } = plot.size;

    // Bridge deck
    const deckGeometry = new THREE.BoxGeometry(width, 0.5, depth);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.y = 0.25;
    deck.castShadow = true;
    deck.receiveShadow = true;
    group.add(deck);

    // Railings
    const railingGeometry = new THREE.BoxGeometry(0.2, 1, depth);
    const railingMaterial = new THREE.MeshStandardMaterial({
      color: 0x6b4423,
      roughness: 0.8,
    });

    const leftRailing = new THREE.Mesh(railingGeometry, railingMaterial);
    leftRailing.position.set(-width / 2 + 0.1, 1, 0);
    leftRailing.castShadow = true;
    group.add(leftRailing);

    const rightRailing = new THREE.Mesh(railingGeometry, railingMaterial);
    rightRailing.position.set(width / 2 - 0.1, 1, 0);
    rightRailing.castShadow = true;
    group.add(rightRailing);
  }
}
