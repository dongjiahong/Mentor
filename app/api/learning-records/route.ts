import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { ActivityType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const db = getDatabase();

    switch (action) {
      case 'record_activity':
        return handleRecordActivity(db, data);
      case 'get_stats':
        return handleGetStats(db, data);
      case 'get_records':
        return handleGetRecords(db, data);
      case 'evaluate_abilities':
        return handleEvaluateAbilities(db);
      case 'get_progress_trend':
        return handleGetProgressTrend(db, data);
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('学习记录API错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

function handleRecordActivity(db: any, data: any) {
  try {
    const { activityType, contentId, word, accuracyScore, timeSpent } = data;

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

    const record = db.prepare('SELECT * FROM learning_records WHERE id = ?').get(result.lastInsertRowid);

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

function handleGetStats(db: any, data: any) {
  try {
    const { startDate, endDate } = data || {};

    let timeCondition = '';
    const params: any[] = [];

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
    const totalTimeResult = db.prepare(totalTimeQuery).get(...params);
    const totalStudyTime = totalTimeResult?.total_time || 0;

    // 2. 单词统计
    const wordStatsQuery = `
      SELECT 
        COUNT(DISTINCT word) as total_words,
        COUNT(DISTINCT CASE WHEN proficiency_level >= 4 THEN word END) as mastered_words
      FROM wordbook
    `;
    const wordStatsResult = db.prepare(wordStatsQuery).get();
    const totalWords = wordStatsResult?.total_words || 0;
    const masteredWords = wordStatsResult?.mastered_words || 0;

    // 3. 平均准确率
    const accuracyQuery = `
      SELECT AVG(accuracy_score) as avg_accuracy 
      FROM learning_records 
      WHERE accuracy_score IS NOT NULL ${timeCondition}
    `;
    const accuracyResult = db.prepare(accuracyQuery).get(...params);
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
    const activitiesResult = db.prepare(activitiesQuery).all(...params);

    const activitiesByType: Record<string, number> = {
      reading: 0,
      listening: 0,
      speaking: 0,
      translation: 0
    };

    activitiesResult.forEach((row: any) => {
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

function handleGetRecords(db: any, data: any) {
  try {
    const { limit = 10, offset = 0, activityType } = data || {};

    let query = 'SELECT * FROM learning_records';
    const params: any[] = [];

    if (activityType) {
      query += ' WHERE activity_type = ?';
      params.push(activityType);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const records = db.prepare(query).all(...params);

    const formattedRecords = records.map((record: any) => ({
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

function handleEvaluateAbilities(db: any) {
  try {
    // 1. 评估词汇水平
    const vocabularyQuery = `
      SELECT 
        COUNT(*) as total_words,
        COUNT(CASE WHEN proficiency_level >= 4 THEN 1 END) as mastered_words,
        AVG(proficiency_level) as avg_proficiency
      FROM wordbook
    `;
    const vocabResult = db.prepare(vocabularyQuery).get();
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
    const pronResult = db.prepare(pronunciationQuery).get();
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
    const readingResult = db.prepare(readingQuery).get();
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

function handleGetProgressTrend(db: any, data: any) {
  try {
    const { startDate, endDate, days = 30 } = data || {};

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