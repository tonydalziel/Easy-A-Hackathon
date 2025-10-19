'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CargoPath {
  id: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  progress: number;
  speed: number;
  color: string;
  itemName: string;
}

export default function AnimatedGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cargoPathsRef = useRef<CargoPath[]>([]);
  const rotationRef = useRef(0);
  const animationFrameRef = useRef<number>();

  // Major cities coordinates for cargo routes
  const cities = [
    { name: 'New York', lat: 40.7128, lng: -74.0060 },
    { name: 'London', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
    { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
    { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
    { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
    { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
  ];

  const items = [
    'Coffee Beans', 'Electronics', 'Smartphones', 'Laptops', 'Watches',
    'Sneakers', 'Headphones', 'Tablets', 'Cameras', 'Books'
  ];

  // Convert lat/lng to 3D coordinates
  const latLngToXYZ = (lat: number, lng: number, radius: number, rotation: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + rotation) * (Math.PI / 180);
    
    return {
      x: radius * Math.sin(phi) * Math.cos(theta),
      y: radius * Math.cos(phi),
      z: radius * Math.sin(phi) * Math.sin(theta),
    };
  };

  // Create a new cargo path
  const createCargoPath = (): CargoPath => {
    const start = cities[Math.floor(Math.random() * cities.length)];
    let end = cities[Math.floor(Math.random() * cities.length)];
    
    // Ensure start and end are different
    while (end === start) {
      end = cities[Math.floor(Math.random() * cities.length)];
    }

    const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff0099'];
    
    return {
      id: Math.random().toString(36),
      startLat: start.lat,
      startLng: start.lng,
      endLat: end.lat,
      endLng: end.lng,
      progress: 0,
      speed: 0.002 + Math.random() * 0.003,
      color: colors[Math.floor(Math.random() * colors.length)],
      itemName: items[Math.floor(Math.random() * items.length)]
    };
  };

  useEffect(() => {
    // Initialize with more cargo paths
    cargoPathsRef.current = Array.from({ length: 20 }, () => createCargoPath());

    // Add new cargo paths more frequently
    const interval = setInterval(() => {
      if (cargoPathsRef.current.length < 30) {
        cargoPathsRef.current = [...cargoPathsRef.current, createCargoPath()];
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2 + 100; // Move down by 100px
    let radius = Math.min(canvas.width, canvas.height) * 0.3;

    const drawGlobe = () => {
      // Recalculate center and radius in case of resize
      centerX = canvas.width / 2;
      centerY = canvas.height / 2 + 100; // Move down by 100px
      radius = Math.min(canvas.width, canvas.height) * 0.3;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw outer glow
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.3);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.1)');
      gradient.addColorStop(0.5, 'rgba(138, 43, 226, 0.05)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw globe sphere base with gradient
      const sphereGradient = ctx.createRadialGradient(
        centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.1,
        centerX, centerY, radius
      );
      sphereGradient.addColorStop(0, 'rgba(30, 58, 138, 0.4)'); // Light blue
      sphereGradient.addColorStop(0.5, 'rgba(17, 24, 39, 0.6)'); // Dark
      sphereGradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)'); // Very dark edge
      
      ctx.fillStyle = sphereGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw continents (simplified land masses)
      const continents = [
        // North America
        { lat: 40, lng: -100, width: 60, height: 50 },
        // South America
        { lat: -15, lng: -60, width: 40, height: 70 },
        // Europe
        { lat: 50, lng: 10, width: 30, height: 25 },
        // Africa
        { lat: 0, lng: 20, width: 50, height: 60 },
        // Asia
        { lat: 35, lng: 90, width: 80, height: 60 },
        // Australia
        { lat: -25, lng: 135, width: 35, height: 25 },
      ];

      continents.forEach(continent => {
        ctx.save(); // Save context state
        
        for (let latOffset = -continent.height/2; latOffset < continent.height/2; latOffset += 4) {
          for (let lngOffset = -continent.width/2; lngOffset < continent.width/2; lngOffset += 4) {
            const lat = continent.lat + latOffset;
            const lng = continent.lng + lngOffset;
            const pos = latLngToXYZ(lat, lng, radius * 1.005, rotationRef.current);
            
            // Only draw if on visible side and within bounds
            if (pos.z > 0) {
              const x = centerX + pos.x;
              const y = centerY - pos.y;
              
              // Check if point is within the globe circle
              const distFromCenter = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
              if (distFromCenter < radius) {
                const depthFactor = Math.min(1, Math.max(0, pos.z / radius));
                const opacity = depthFactor * 0.25;
                
                ctx.fillStyle = `rgba(34, 197, 94, ${opacity})`;
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }
        }
        
        ctx.restore(); // Restore context state
      });

      // Draw globe wireframe (latitude lines)
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      
      for (let lat = -80; lat <= 80; lat += 20) {
        ctx.beginPath();
        let started = false;
        for (let lng = 0; lng <= 360; lng += 5) {
          const pos = latLngToXYZ(lat, lng, radius, rotationRef.current);
          if (pos.z > 0) { // Only draw visible side
            const x = centerX + pos.x;
            const y = centerY - pos.y;
            const opacity = Math.max(0.1, pos.z / radius * 0.3);
            ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
            
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      }

      // Draw longitude lines
      for (let lng = 0; lng < 360; lng += 30) {
        ctx.beginPath();
        let started = false;
        for (let lat = -90; lat <= 90; lat += 5) {
          const pos = latLngToXYZ(lat, lng, radius, rotationRef.current);
          if (pos.z > 0) {
            const x = centerX + pos.x;
            const y = centerY - pos.y;
            const opacity = Math.max(0.1, pos.z / radius * 0.3);
            ctx.strokeStyle = `rgba(0, 255, 255, ${opacity})`;
            
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      }

      // Draw equator with subtle glow
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 2;
      ctx.shadowColor = '#00ffff';
      ctx.beginPath();
      for (let lng = 0; lng <= 360; lng += 2) {
        const pos = latLngToXYZ(0, lng, radius, rotationRef.current);
        if (pos.z > 0) {
          const x = centerX + pos.x;
          const y = centerY - pos.y;
          if (lng === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Add atmospheric glow around edge
      const atmosphereGradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.95,
        centerX, centerY, radius * 1.15
      );
      atmosphereGradient.addColorStop(0, 'rgba(100, 200, 255, 0)');
      atmosphereGradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.15)');
      atmosphereGradient.addColorStop(1, 'rgba(100, 200, 255, 0)');
      
      ctx.fillStyle = atmosphereGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.15, 0, Math.PI * 2);
      ctx.fill();

      // Draw cities as glowing dots
      cities.forEach(city => {
        const pos = latLngToXYZ(city.lat, city.lng, radius, rotationRef.current);
        if (pos.z > 0) {
          const x = centerX + pos.x;
          const y = centerY - pos.y;
          
          // Glow
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#ff00ff';
          ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

            // Draw cargo paths
      const updatedPaths = cargoPathsRef.current.map((path: CargoPath) => {
        const newProgress = path.progress + path.speed;
        
        if (newProgress >= 1) {
          return null; // Remove completed paths
        }

        // Interpolate between start and end using great circle path
        const t = newProgress;
        const lat = path.startLat + (path.endLat - path.startLat) * t;
        const lng = path.startLng + (path.endLng - path.startLng) * t;
        
        // Add arc to the path (simulate flight arc)
        const arcHeight = Math.sin(t * Math.PI) * 0.3;
        const currentRadius = radius * (1 + arcHeight);
        
        const pos = latLngToXYZ(lat, lng, currentRadius, rotationRef.current);
        
        if (pos.z > 0) {
          const x = centerX + pos.x;
          const y = centerY - pos.y;

          // Draw trailing line
          ctx.strokeStyle = path.color;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 15;
          ctx.shadowColor = path.color;
          
          ctx.beginPath();
          const trailLength = 20;
          for (let i = 0; i < trailLength; i++) {
            const trailT = Math.max(0, newProgress - (i * 0.02));
            const trailLat = path.startLat + (path.endLat - path.startLat) * trailT;
            const trailLng = path.startLng + (path.endLng - path.startLng) * trailT;
            const trailArc = Math.sin(trailT * Math.PI) * 0.3;
            const trailRadius = radius * (1 + trailArc);
            const trailPos = latLngToXYZ(trailLat, trailLng, trailRadius, rotationRef.current);
            
            if (trailPos.z > 0) {
              const trailX = centerX + trailPos.x;
              const trailY = centerY - trailPos.y;
              
              if (i === 0) {
                ctx.moveTo(trailX, trailY);
              } else {
                ctx.globalAlpha = 1 - (i / trailLength);
                ctx.lineTo(trailX, trailY);
              }
            }
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;

          // Draw cargo icon (glowing dot)
          ctx.shadowBlur = 20;
          ctx.shadowColor = path.color;
          ctx.fillStyle = path.color;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        return { ...path, progress: newProgress };
      }).filter((p: CargoPath | null) => p !== null) as CargoPath[];

      cargoPathsRef.current = updatedPaths;

      // Rotate globe
      rotationRef.current += 0.1;
      if (rotationRef.current >= 360) rotationRef.current = 0;

      animationFrameRef.current = requestAnimationFrame(drawGlobe);
    };

    drawGlobe();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 animate-gradient-shift" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${10 + Math.random() * 20}s`,
            }}
          />
        ))}
      </div>

      {/* Globe canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 opacity-70"
        style={{ mixBlendMode: 'screen' }}
      />
      
      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-slate-950/30" />
    </div>
  );
}
