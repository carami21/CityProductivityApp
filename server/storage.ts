import { users, sessions, cities, userStats, type User, type InsertUser, type Session, type InsertSession, type City, type InsertCity, type UserStats, type InsertUserStats } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session operations
  createSession(session: InsertSession): Promise<Session>;
  getUserSessions(userId: number, limit?: number): Promise<Session[]>;
  getTodaysSessions(userId: number): Promise<Session[]>;
  
  // City operations
  getUserCity(userId: number): Promise<City | undefined>;
  updateCity(userId: number, cityData: Partial<InsertCity>): Promise<City>;
  createCity(cityData: InsertCity): Promise<City>;
  
  // User stats operations
  getUserStats(userId: number): Promise<UserStats | undefined>;
  updateUserStats(userId: number, stats: Partial<InsertUserStats>): Promise<UserStats>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, Session>;
  private cities: Map<number, City>;
  private userStats: Map<number, UserStats>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentCityId: number;
  private currentStatsId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.cities = new Map();
    this.userStats = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentCityId = 1;
    this.currentStatsId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    
    // Create default city and stats for new user
    await this.createCity({
      userId: id,
      gridData: Array(8).fill(null).map(() => Array(8).fill(null)),
      resources: { bricks: 0, coins: 0 }
    });
    
    await this.createUserStats({
      userId: id,
      totalSessions: 0,
      totalFocusTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      totalBricks: 0,
      totalCoins: 0,
      lastSessionDate: null
    });
    
    return user;
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const session: Session = {
      ...insertSession,
      id,
      completedAt: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async getUserSessions(userId: number, limit = 10): Promise<Session[]> {
    return Array.from(this.sessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, limit);
  }

  async getTodaysSessions(userId: number): Promise<Session[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return Array.from(this.sessions.values())
      .filter(session => 
        session.userId === userId && 
        new Date(session.completedAt) >= today
      );
  }

  async getUserCity(userId: number): Promise<City | undefined> {
    return Array.from(this.cities.values()).find(city => city.userId === userId);
  }

  async updateCity(userId: number, cityData: Partial<InsertCity>): Promise<City> {
    const existingCity = await this.getUserCity(userId);
    if (!existingCity) {
      throw new Error('City not found');
    }
    
    const updatedCity: City = {
      ...existingCity,
      ...cityData,
      updatedAt: new Date(),
    };
    
    this.cities.set(existingCity.id, updatedCity);
    return updatedCity;
  }

  async createCity(cityData: InsertCity): Promise<City> {
    const id = this.currentCityId++;
    const city: City = {
      ...cityData,
      id,
      updatedAt: new Date(),
    };
    this.cities.set(id, city);
    return city;
  }

  async getUserStats(userId: number): Promise<UserStats | undefined> {
    return Array.from(this.userStats.values()).find(stats => stats.userId === userId);
  }

  async updateUserStats(userId: number, statsData: Partial<InsertUserStats>): Promise<UserStats> {
    const existingStats = await this.getUserStats(userId);
    if (!existingStats) {
      throw new Error('User stats not found');
    }
    
    const updatedStats: UserStats = {
      ...existingStats,
      ...statsData,
    };
    
    this.userStats.set(existingStats.id, updatedStats);
    return updatedStats;
  }

  async createUserStats(statsData: InsertUserStats): Promise<UserStats> {
    const id = this.currentStatsId++;
    const stats: UserStats = {
      ...statsData,
      id,
    };
    this.userStats.set(id, stats);
    return stats;
  }
}

export const storage = new MemStorage();
