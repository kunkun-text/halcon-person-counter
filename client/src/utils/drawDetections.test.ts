import { describe, it, expect } from 'vitest';
import { getDetectionStats } from './drawDetections';

describe('drawDetections utilities', () => {
  describe('getDetectionStats', () => {
    it('should return zero stats for empty detections array', () => {
      const stats = getDetectionStats([]);
      
      expect(stats.totalPeople).toBe(0);
      expect(stats.avgConfidence).toBe(0);
      expect(stats.minConfidence).toBe(0);
      expect(stats.maxConfidence).toBe(0);
    });

    it('should calculate correct stats for single detection', () => {
      const detections = [
        {
          id: 1,
          x: 10,
          y: 20,
          width: 100,
          height: 150,
          confidence: 0.85,
        },
      ];

      const stats = getDetectionStats(detections);

      expect(stats.totalPeople).toBe(1);
      expect(stats.avgConfidence).toBe(0.85);
      expect(stats.minConfidence).toBe(0.85);
      expect(stats.maxConfidence).toBe(0.85);
    });

    it('should calculate correct stats for multiple detections', () => {
      const detections = [
        {
          id: 1,
          x: 10,
          y: 20,
          width: 100,
          height: 150,
          confidence: 0.8,
        },
        {
          id: 2,
          x: 150,
          y: 30,
          width: 90,
          height: 140,
          confidence: 0.9,
        },
        {
          id: 3,
          x: 300,
          y: 40,
          width: 110,
          height: 160,
          confidence: 0.7,
        },
      ];

      const stats = getDetectionStats(detections);

      expect(stats.totalPeople).toBe(3);
      expect(stats.avgConfidence).toBeCloseTo(0.8, 1);
      expect(stats.minConfidence).toBe(0.7);
      expect(stats.maxConfidence).toBe(0.9);
    });

    it('should handle confidence values close to 1', () => {
      const detections = [
        {
          id: 1,
          x: 10,
          y: 20,
          width: 100,
          height: 150,
          confidence: 0.99,
        },
        {
          id: 2,
          x: 150,
          y: 30,
          width: 90,
          height: 140,
          confidence: 0.98,
        },
      ];

      const stats = getDetectionStats(detections);

      expect(stats.totalPeople).toBe(2);
      expect(stats.avgConfidence).toBeCloseTo(0.985, 2);
      expect(stats.minConfidence).toBe(0.98);
      expect(stats.maxConfidence).toBe(0.99);
    });

    it('should handle confidence values close to 0', () => {
      const detections = [
        {
          id: 1,
          x: 10,
          y: 20,
          width: 100,
          height: 150,
          confidence: 0.01,
        },
        {
          id: 2,
          x: 150,
          y: 30,
          width: 90,
          height: 140,
          confidence: 0.05,
        },
      ];

      const stats = getDetectionStats(detections);

      expect(stats.totalPeople).toBe(2);
      expect(stats.avgConfidence).toBeCloseTo(0.03, 2);
      expect(stats.minConfidence).toBe(0.01);
      expect(stats.maxConfidence).toBe(0.05);
    });
  });
});
