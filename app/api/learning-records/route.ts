import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { DatabaseConnection, LearningRecordRow, ActivityStatsResult } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const db = getDatabase();

    switch (action) {
      case 'record_activity':
        return handleRecordActivity(db, data);
      case 'record_word_lookup':
        return handleRecordWordLookup(db, data);
      case 'get_stats':
        return handleGetStats(db, data);
      case 'get_records':
        return handleGetRecords(db, data);
      case 'evaluate_abilities':
        return handleEvaluateAbilities(db);
      case 'get_progress_trend':
        return handleGetProgressTrend(db, data);
      case 'generate_report':
        return handleGenerateReport(db, data);
      case 'check_level_upgrade':
        return handleCheckLevelUpgrade();
      case 'get_achievements':
        return handleGetAchievements();
      case 'get_recommendations':
        return handleGetRecommendations();
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('学习记录API错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

interface RecordActivityData {
  activityType: string;
  contentId?: number;
  word?: string;
  accuracyScore?: number;
  timeSpent: number;
}

function handleRecordActivity(db: DatabaseConnection, data: RecordActivityData) {
  try {
    const { activityType, contentId, word, accuracyScore, timeSpent } = data;

    // 验证必需的字段
    if (!activityType || timeSpent == null || timeSpent < 0) {
      return NextResponse.json({ error: '缺少必要参数：activityType 和 timeSpent 是必需的' }, { status: 400 });
    }

    // 验证 activityType 的值
    const validActivityTypes = ['reading', 'listening', 'speaking', 'translation'];
    if (!validActivityTypes.includes(activityType)) {
      return NextResponse.json({ 
        error: `无效的活动类型：${activityType}。有效值为：${validActivityTypes.join(', ')}` 
      }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO learning_records (activity_type, content_id, word, accuracy_score, time_spent)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      activityType,
      contentId || null,
      word || null,
      accuracyScore || null,
      timeSpent
    );

    const record = db.prepare('SELECT * FROM learning_records WHERE id = ?').get(result.lastInsertRowid) as LearningRecordRow;

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        activityType: record.activity_type,
        contentId: record.content_id,
        word: record.word,
        accuracyScore: record.accuracy_score,
        timeSpent: record.time_spent,
        createdAt: new Date(record.created_at)
      }
    });
  } catch (error) {
    console.error('记录学习活动失败:', error);
    return NextResponse.json({ error: '记录失败' }, { status: 500 });
  }
}

interface GetStatsData {
  startDate?: string;
  endDate?: string;
}

function handleGetStats(db: DatabaseConnection, data: GetStatsData) {
  try {
    const { startDate, endDate } = data || {};

    let timeCondition = '';
    const params: (string | number)[] = [];

    if (startDate) {
      timeCondition += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      timeCondition += ' AND created_at <= ?';
      params.push(endDate);
    }

    // 1. 总学习时间
    const totalTimeQuery = `
      SELECT COALESCE(SUM(time_spent), 0) as total_time 
      FROM learning_records 
      WHERE 1=1 ${timeCondition}
    `;
    const totalTimeResult = db.prepare(totalTimeQuery).get(...params) as { total_time?: number } | undefined;
    const totalStudyTime = totalTimeResult?.total_time || 0;

    // 2. 单词统计
    const wordStatsQuery = `
      SELECT 
        COUNT(DISTINCT word) as total_words,
        COUNT(DISTINCT CASE WHEN proficiency_level >= 4 THEN word END) as mastered_words
      FROM wordbook
    `;
    const wordStatsResult = db.prepare(wordStatsQuery).get() as { total_words?: number; mastered_words?: number } | undefined;
    const totalWords = wordStatsResult?.total_words || 0;
    const masteredWords = wordStatsResult?.mastered_words || 0;

    // 3. 平均准确率
    const accuracyQuery = `
      SELECT AVG(accuracy_score) as avg_accuracy 
      FROM learning_records 
      WHERE accuracy_score IS NOT NULL ${timeCondition}
    `;
    const accuracyResult = db.prepare(accuracyQuery).get(...params) as { avg_accuracy?: number } | undefined;
    const averageAccuracy = accuracyResult?.avg_accuracy || 0;

    // 4. 连续学习天数（简化实现）
    const streakDays = 0;

    // 5. 按活动类型统计
    const activitiesQuery = `
      SELECT 
        activity_type,
        COUNT(*) as count
      FROM learning_records 
      WHERE 1=1 ${timeCondition}
      GROUP BY activity_type
    `;
    const activitiesResult = db.prepare(activitiesQuery).all(...params) as ActivityStatsResult[];

    const activitiesByType: Record<string, number> = {
      reading: 0,
      listening: 0,
      speaking: 0,
      translation: 0
    };

    activitiesResult.forEach((row: ActivityStatsResult) => {
      activitiesByType[row.activity_type] = row.count;
    });

    return NextResponse.json({
      success: true,
      data: {
        totalStudyTime,
        totalWords,
        masteredWords,
        averageAccuracy,
        streakDays,
        activitiesByType
      }
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}

interface GetRecordsData {
  limit?: number;
  offset?: number;
  activityType?: string;
}

function handleGetRecords(db: DatabaseConnection, data: GetRecordsData) {
  try {
    const { limit = 10, offset = 0, activityType } = data || {};

    let query = 'SELECT * FROM learning_records';
    const params: (string | number)[] = [];

    if (activityType) {
      query += ' WHERE activity_type = ?';
      params.push(activityType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const records = db.prepare(query).all(...params) as LearningRecordRow[];

    const formattedRecords = records.map((record: LearningRecordRow) => ({
      id: record.id,
      activityType: record.activity_type,
      contentId: record.content_id,
      word: record.word,
      accuracyScore: record.accuracy_score,
      timeSpent: record.time_spent,
      createdAt: new Date(record.created_at)
    }));

    return NextResponse.json({
      success: true,
      data: formattedRecords
    });
  } catch (error) {
    console.error('获取学习记录失败:', error);
    return NextResponse.json({ error: '获取记录失败' }, { status: 500 });
  }
}

function handleEvaluateAbilities(db: DatabaseConnection) {
  try {
    // 1. 评估词汇水平
    const vocabularyQuery = `
      SELECT 
        COUNT(*) as total_words,
        COUNT(CASE WHEN proficiency_level >= 4 THEN 1 END) as mastered_words,
        AVG(proficiency_level) as avg_proficiency
      FROM wordbook
    `;
    const vocabResult = db.prepare(vocabularyQuery).get() as { total_words?: number; mastered_words?: number; avg_proficiency?: number } | undefined;
    const totalWords = vocabResult?.total_words || 0;
    const masteredWords = vocabResult?.mastered_words || 0;

    // 根据掌握的单词数量评估词汇水平
    const vocabularyLevel = calculateVocabularyLevel(masteredWords);
    const vocabularyScore = Math.min(100, (masteredWords / getVocabularyTarget(vocabularyLevel)) * 100);

    // 2. 评估发音水平
    const pronunciationQuery = `
      SELECT 
        AVG(accuracy_score) as avg_accuracy,
        COUNT(*) as total_attempts
      FROM learning_records 
      WHERE activity_type = 'speaking' 
        AND accuracy_score IS NOT NULL 
        AND created_at >= datetime('now', '-30 days')
    `;
    const pronResult = db.prepare(pronunciationQuery).get() as { avg_accuracy?: number; total_attempts?: number } | undefined;
    const pronunciationAccuracy = pronResult?.avg_accuracy || 0;
    const pronunciationLevel = calculatePronunciationLevel(pronunciationAccuracy);
    const recentImprovement = 0; // 简化实现

    // 3. 评估阅读水平
    const readingQuery = `
      SELECT 
        AVG(time_spent) as avg_reading_time,
        AVG(accuracy_score) as avg_comprehension
      FROM learning_records 
      WHERE activity_type = 'reading' 
        AND created_at >= datetime('now', '-30 days')
    `;
    const readingResult = db.prepare(readingQuery).get() as { avg_reading_time?: number; avg_comprehension?: number } | undefined;
    const averageReadingTime = readingResult?.avg_reading_time || 0;
    const comprehensionAccuracy = readingResult?.avg_comprehension || 0;
    const readingLevel = calculateReadingLevel(comprehensionAccuracy, averageReadingTime);

    return NextResponse.json({
      success: true,
      data: {
        vocabularyLevel: {
          level: vocabularyLevel,
          score: vocabularyScore,
          totalWords,
          masteredWords
        },
        pronunciationLevel: {
          level: pronunciationLevel,
          score: pronunciationAccuracy,
          averageAccuracy: pronunciationAccuracy,
          recentImprovement
        },
        readingLevel: {
          level: readingLevel,
          score: comprehensionAccuracy,
          averageReadingTime,
          comprehensionAccuracy
        }
      }
    });
  } catch (error) {
    console.error('评估用户能力失败:', error);
    return NextResponse.json({ error: '评估失败' }, { status: 500 });
  }
}

// 辅助函数
function calculateVocabularyLevel(masteredWords: number): string {
  if (masteredWords >= 8000) return 'C2';
  if (masteredWords >= 6000) return 'C1';
  if (masteredWords >= 4000) return 'B2';
  if (masteredWords >= 2500) return 'B1';
  if (masteredWords >= 1500) return 'A2';
  return 'A1';
}

function getVocabularyTarget(level: string): number {
  const targets: Record<string, number> = {
    'A1': 1500,
    'A2': 2500,
    'B1': 4000,
    'B2': 6000,
    'C1': 8000,
    'C2': 10000
  };
  return targets[level] || 1500;
}

function calculatePronunciationLevel(accuracy: number): string {
  if (accuracy >= 95) return 'C2';
  if (accuracy >= 90) return 'C1';
  if (accuracy >= 85) return 'B2';
  if (accuracy >= 75) return 'B1';
  if (accuracy >= 65) return 'A2';
  return 'A1';
}

function calculateReadingLevel(comprehensionAccuracy: number, averageReadingTime: number): string {
  const comprehensionScore = comprehensionAccuracy;
  const efficiencyScore = Math.max(0, 100 - (averageReadingTime / 60));
  const overallScore = (comprehensionScore * 0.7) + (efficiencyScore * 0.3);

  if (overallScore >= 90) return 'C2';
  if (overallScore >= 80) return 'C1';
  if (overallScore >= 70) return 'B2';
  if (overallScore >= 60) return 'B1';
  if (overallScore >= 50) return 'A2';
  return 'A1';
}

interface GetProgressTrendData {
  startDate?: string;
  endDate?: string;
  days?: number;
}

function handleGetProgressTrend(db: DatabaseConnection, data: GetProgressTrendData) {
  try {
    const { days = 30 } = data || {};

    // 简化实现：生成模拟的趋势数据
    const dailyStats = [];
    const weeklyStats = [];
    const monthlyStats = [];

    // 生成过去30天的每日数据
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // 模拟数据，实际应该从数据库查询
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        studyTime: Math.floor(Math.random() * 3600), // 0-1小时
        accuracy: 70 + Math.random() * 30, // 70-100%
        wordsLearned: Math.floor(Math.random() * 10) // 0-10个单词
      });
    }

    // 生成过去几周的数据
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));

      weeklyStats.push({
        week: `第${4 - i}周`,
        studyTime: Math.floor(Math.random() * 25200), // 0-7小时
        accuracy: 70 + Math.random() * 30,
        wordsLearned: Math.floor(Math.random() * 70)
      });
    }

    // 生成过去几个月的数据
    for (let i = 2; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);

      monthlyStats.push({
        month: `${month.getMonth() + 1}月`,
        studyTime: Math.floor(Math.random() * 108000), // 0-30小时
        accuracy: 70 + Math.random() * 30,
        wordsLearned: Math.floor(Math.random() * 300)
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        dailyStats,
        weeklyStats,
        monthlyStats
      }
    });
  } catch (error) {
    console.error('获取进度趋势失败:', error);
    return NextResponse.json({ error: '获取趋势失败' }, { status: 500 });
  }
}

interface RecordWordLookupData {
  word: string;
  lookupType: string;
}

function handleRecordWordLookup(db: DatabaseConnection, data: RecordWordLookupData) {
  try {
    const { word, lookupType } = data;

    if (!word || !lookupType) {
      return NextResponse.json({ error: '缺少必要参数：word 和 lookupType' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT INTO learning_records (activity_type, word, time_spent)
      VALUES (?, ?, ?)
    `);

    const result = stmt.run('translation', word, 10); // 假设查词花费10秒

    const record = db.prepare('SELECT * FROM learning_records WHERE id = ?').get(result.lastInsertRowid) as LearningRecordRow;

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        activityType: record.activity_type,
        word: record.word,
        timeSpent: record.time_spent,
        createdAt: new Date(record.created_at)
      }
    });
  } catch (error) {
    console.error('记录单词查询失败:', error);
    return NextResponse.json({ error: '记录失败' }, { status: 500 });
  }
}

interface GenerateReportData {
  startDate?: string;
  endDate?: string;
}

async function handleGenerateReport(db: DatabaseConnection, data: GenerateReportData) {
  try {
    // 1. 获取基本统计数据
    const { startDate, endDate } = data || {};
    let timeCondition = '';
    const params: (string | number)[] = [];

    if (startDate) {
      timeCondition += ' AND created_at >= ?';
      params.push(startDate);
    }

    if (endDate) {
      timeCondition += ' AND created_at <= ?';
      params.push(endDate);
    }

    // 获取总学习时间和活动总数
    const totalTimeQuery = `
      SELECT 
        COALESCE(SUM(time_spent), 0) as totalStudyTime,
        COUNT(*) as totalActivities,
        COALESCE(AVG(accuracy_score), 0) as averageAccuracy
      FROM learning_records 
      WHERE 1=1 ${timeCondition}
    `;
    const summaryResult = db.prepare(totalTimeQuery).get(...params) as { 
      totalStudyTime?: number; 
      totalActivities?: number; 
      averageAccuracy?: number; 
    } | undefined;

    // 获取掌握词汇数
    const wordStatsQuery = `
      SELECT 
        COUNT(DISTINCT word) as totalWords,
        COUNT(DISTINCT CASE WHEN proficiency_level >= 4 THEN word END) as masteredWords
      FROM wordbook
    `;
    const wordResult = db.prepare(wordStatsQuery).get() as { totalWords?: number; masteredWords?: number } | undefined;

    // 获取按活动类型统计
    const activitiesQuery = `
      SELECT 
        activity_type,
        COUNT(*) as count
      FROM learning_records 
      WHERE 1=1 ${timeCondition}
      GROUP BY activity_type
    `;
    const activitiesResult = db.prepare(activitiesQuery).all(...params) as ActivityStatsResult[];

    const activitiesByType: Record<string, number> = {
      reading: 0,
      listening: 0,
      speaking: 0,
      translation: 0
    };

    activitiesResult.forEach((row: ActivityStatsResult) => {
      activitiesByType[row.activity_type] = row.count;
    });

    // 2. 评估能力水平
    const masteredWords = wordResult?.masteredWords || 0;
    const vocabularyLevel = calculateVocabularyLevel(masteredWords);

    // 获取发音准确率
    const pronunciationQuery = `
      SELECT AVG(accuracy_score) as avgAccuracy
      FROM learning_records 
      WHERE activity_type = 'speaking' 
        AND accuracy_score IS NOT NULL 
        AND created_at >= datetime('now', '-30 days')
    `;
    const pronResult = db.prepare(pronunciationQuery).get() as { avgAccuracy?: number } | undefined;
    const pronunciationAccuracy = pronResult?.avgAccuracy || 0;
    const pronunciationLevel = calculatePronunciationLevel(pronunciationAccuracy);

    // 获取阅读数据
    const readingQuery = `
      SELECT 
        AVG(time_spent) as avgReadingTime,
        AVG(accuracy_score) as avgComprehension
      FROM learning_records 
      WHERE activity_type = 'reading' 
        AND created_at >= datetime('now', '-30 days')
    `;
    const readingResult = db.prepare(readingQuery).get() as { avgReadingTime?: number; avgComprehension?: number } | undefined;
    const comprehensionAccuracy = readingResult?.avgComprehension || 0;
    const readingLevel = calculateReadingLevel(comprehensionAccuracy, readingResult?.avgReadingTime || 0);

    // 3. 生成趋势数据
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        studyTime: Math.floor(Math.random() * 3600),
        accuracy: 70 + Math.random() * 30,
        wordsLearned: Math.floor(Math.random() * 10)
      });
    }

    // 4. 生成建议和成就
    const recommendations = [
      '建议每天保持30分钟以上的学习时间',
      '注重听说读写的均衡练习',
      '定期复习掌握的词汇',
      '可以尝试更有挑战性的练习内容'
    ];

    const achievements = [
      {
        type: 'daily',
        title: '坚持学习',
        description: '连续学习7天',
        achievedAt: new Date()
      }
    ];

    // 5. 生成完整报告
    const report = {
      summary: {
        totalStudyTime: summaryResult?.totalStudyTime || 0,
        totalActivities: summaryResult?.totalActivities || 0,
        masteredWords: masteredWords,
        averageAccuracy: summaryResult?.averageAccuracy || 0,
        streakDays: 3, // 简化实现
        activitiesByType
      },
      abilities: {
        vocabularyLevel: {
          level: vocabularyLevel,
          score: Math.min(100, (masteredWords / getVocabularyTarget(vocabularyLevel)) * 100),
          totalWords: wordResult?.totalWords || 0,
          masteredWords: masteredWords
        },
        pronunciationLevel: {
          level: pronunciationLevel,
          score: pronunciationAccuracy,
          averageAccuracy: pronunciationAccuracy,
          recentImprovement: 0
        },
        readingLevel: {
          level: readingLevel,
          score: comprehensionAccuracy,
          averageReadingTime: readingResult?.avgReadingTime || 0,
          comprehensionAccuracy: comprehensionAccuracy
        }
      },
      trends: {
        dailyStats
      },
      recommendations,
      achievements
    };

    return NextResponse.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('生成学习报告失败:', error);
    return NextResponse.json({ error: '生成报告失败' }, { status: 500 });
  }
}

function handleCheckLevelUpgrade() {
  try {
    // 简化实现：检查是否需要升级
    return NextResponse.json({
      success: true,
      data: {
        canUpgrade: false,
        currentLevel: 'A2',
        nextLevel: 'B1',
        requirements: ['掌握更多词汇', '提高听力理解能力'],
        progress: 65
      }
    });
  } catch (error) {
    console.error('检查等级升级失败:', error);
    return NextResponse.json({ error: '检查失败' }, { status: 500 });
  }
}

function handleGetAchievements() {
  try {
    const achievements = [
      {
        id: 'first_day',
        name: '初来乍到',
        description: '完成第一天的学习',
        icon: '🎉',
        unlocked: true,
        progress: 100
      },
      {
        id: 'vocab_100',
        name: '词汇达人',
        description: '掌握100个单词',
        icon: '📚',
        unlocked: false,
        progress: 65,
        requirement: '掌握100个单词'
      }
    ];

    return NextResponse.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    console.error('获取成就失败:', error);
    return NextResponse.json({ error: '获取成就失败' }, { status: 500 });
  }
}

function handleGetRecommendations() {
  try {
    const recommendations = [
      '建议增加听力练习时间，提升听力理解能力',
      '注重发音练习，提高口语表达的准确性',
      '扩大词汇量，学习更多高频词汇',
      '保持每天学习的习惯，连续学习效果更好'
    ];

    return NextResponse.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error('获取学习建议失败:', error);
    return NextResponse.json({ error: '获取建议失败' }, { status: 500 });
  }
}