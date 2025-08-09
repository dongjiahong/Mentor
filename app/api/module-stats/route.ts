import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { DatabaseConnection } from '@/types/database';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const db = getDatabase();

    switch (action) {
      case 'get_all_stats':
        return handleGetAllStats(db);
      case 'get_module_stats':
        return handleGetModuleStats(db, data);
      case 'refresh_stats':
        return handleRefreshStats(db, data);
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('模块统计API错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

async function handleGetAllStats(db: DatabaseConnection) {
  try {
    // 1. 获取内容统计
    const contentStats = await getContentStats(db);
    
    // 2. 获取练习模块统计
    const listeningStats = await getListeningStats(db);
    const speakingStats = await getSpeakingStats(db);
    const readingStats = await getReadingStats(db);
    const writingStats = await getWritingStats(db);

    return NextResponse.json({
      success: true,
      data: {
        content: contentStats,
        listening: listeningStats,
        speaking: speakingStats,
        reading: readingStats,
        writing: writingStats
      }
    });
  } catch (error) {
    console.error('获取所有模块统计失败:', error);
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}

async function handleGetModuleStats(db: DatabaseConnection, data: { module: string }) {
  try {
    const { module } = data;
    
    let stats;
    switch (module) {
      case 'content':
        stats = await getContentStats(db);
        break;
      case 'listening':
        stats = await getListeningStats(db);
        break;
      case 'speaking':
        stats = await getSpeakingStats(db);
        break;
      case 'reading':
        stats = await getReadingStats(db);
        break;
      case 'writing':
        stats = await getWritingStats(db);
        break;
      default:
        throw new Error(`未知模块: ${module}`);
    }

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取模块统计失败:', error);
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}

async function handleRefreshStats(db: DatabaseConnection, data: { module: string }) {
  // 统计数据刷新逻辑（如果需要缓存的话）
  return NextResponse.json({
    success: true,
    message: `${data.module} 统计已刷新`
  });
}

// 获取内容模块统计
async function getContentStats(db: DatabaseConnection) {
  // 总内容数
  const totalContentsQuery = `SELECT COUNT(*) as count FROM learning_content`;
  const totalResult = db.prepare(totalContentsQuery).get() as { count?: number } | undefined;
  const totalContents = totalResult?.count || 0;

  // 本周新增内容
  const newThisWeekQuery = `
    SELECT COUNT(*) as count 
    FROM learning_content 
    WHERE created_at >= datetime('now', '-7 days')
  `;
  const newWeekResult = db.prepare(newThisWeekQuery).get() as { count?: number } | undefined;
  const newThisWeek = newWeekResult?.count || 0;

  // 内容类型分类数
  const categoriesQuery = `SELECT COUNT(DISTINCT content_type) as count FROM learning_content`;
  const categoriesResult = db.prepare(categoriesQuery).get() as { count?: number } | undefined;
  const categories = categoriesResult?.count || 0;

  // 最近的内容标题
  const recentContentsQuery = `
    SELECT title 
    FROM learning_content 
    ORDER BY created_at DESC 
    LIMIT 5
  `;
  const recentResults = db.prepare(recentContentsQuery).all() as { title?: string }[];
  const recentContents = recentResults.map(r => r.title || '未知标题').filter(Boolean);

  return {
    totalContents,
    newThisWeek,
    categories,
    recentContents
  };
}

// 获取听力模块统计
async function getListeningStats(db: DatabaseConnection) {
  // 总练习次数
  const totalQuery = `
    SELECT COUNT(*) as count 
    FROM learning_records 
    WHERE activity_type = 'listening'
  `;
  const totalResult = db.prepare(totalQuery).get() as { count?: number } | undefined;
  const totalExercises = totalResult?.count || 0;

  // 平均准确率
  const avgAccuracyQuery = `
    SELECT AVG(accuracy_score) as avg_accuracy 
    FROM learning_records 
    WHERE activity_type = 'listening' AND accuracy_score IS NOT NULL
  `;
  const avgResult = db.prepare(avgAccuracyQuery).get() as { avg_accuracy?: number } | undefined;
  const avgAccuracy = Math.round(avgResult?.avg_accuracy || 0);

  // 最近7天的练习次数
  const recentQuery = `
    SELECT COUNT(*) as count 
    FROM learning_records 
    WHERE activity_type = 'listening' 
      AND created_at >= datetime('now', '-7 days')
  `;
  const recentResult = db.prepare(recentQuery).get() as { count?: number } | undefined;
  const recentSessions = recentResult?.count || 0;

  return {
    totalExercises,
    avgAccuracy,
    popularTopics: ['日常对话', '新闻听力', '学术讲座'],
    recentSessions
  };
}

// 获取口语模块统计
async function getSpeakingStats(db: DatabaseConnection) {
  const totalQuery = `
    SELECT COUNT(*) as count 
    FROM learning_records 
    WHERE activity_type = 'speaking'
  `;
  const totalResult = db.prepare(totalQuery).get() as { count?: number } | undefined;
  const totalExercises = totalResult?.count || 0;

  const avgQuery = `
    SELECT AVG(accuracy_score) as avg_score 
    FROM learning_records 
    WHERE activity_type = 'speaking' AND accuracy_score IS NOT NULL
  `;
  const avgResult = db.prepare(avgQuery).get() as { avg_score?: number } | undefined;
  const avgPronunciation = Math.round(avgResult?.avg_score || 0);

  const recentQuery = `
    SELECT COUNT(*) as count 
    FROM learning_records 
    WHERE activity_type = 'speaking' 
      AND created_at >= datetime('now', '-7 days')
  `;
  const recentResult = db.prepare(recentQuery).get() as { count?: number } | undefined;
  const recentSessions = recentResult?.count || 0;

  return {
    totalExercises,
    avgPronunciation,
    practiceTypes: ['跟读练习', '对话练习', '自由表达'],
    recentSessions
  };
}

// 获取阅读模块统计
async function getReadingStats(db: DatabaseConnection) {
  const totalQuery = `
    SELECT COUNT(*) as count 
    FROM learning_records 
    WHERE activity_type = 'reading'
  `;
  const totalResult = db.prepare(totalQuery).get() as { count?: number } | undefined;
  const totalArticles = totalResult?.count || 0;

  // 这里暂时使用固定值，实际应该根据真实数据计算
  const avgReadingSpeed = 180; // 字/分钟

  const recentQuery = `
    SELECT COUNT(*) as count 
    FROM learning_records 
    WHERE activity_type = 'reading' 
      AND created_at >= datetime('now', '-7 days')
  `;
  const recentResult = db.prepare(recentQuery).get() as { count?: number } | undefined;
  const recentSessions = recentResult?.count || 0;

  return {
    totalArticles,
    avgReadingSpeed,
    topics: ['科技', '文化', '商务'],
    recentSessions
  };
}

// 获取写作模块统计
async function getWritingStats(db: DatabaseConnection) {
  const totalQuery = `
    SELECT COUNT(*) as count 
    FROM learning_records 
    WHERE activity_type = 'writing'
  `;
  const totalResult = db.prepare(totalQuery).get() as { count?: number } | undefined;
  const totalExercises = totalResult?.count || 0;

  const avgQuery = `
    SELECT AVG(accuracy_score) as avg_score 
    FROM learning_records 
    WHERE activity_type = 'writing' AND accuracy_score IS NOT NULL
  `;
  const avgResult = db.prepare(avgQuery).get() as { avg_score?: number } | undefined;
  const avgScore = Math.round(avgResult?.avg_score || 0);

  const recentQuery = `
    SELECT COUNT(*) as count 
    FROM learning_records 
    WHERE activity_type = 'writing' 
      AND created_at >= datetime('now', '-7 days')
  `;
  const recentResult = db.prepare(recentQuery).get() as { count?: number } | undefined;
  const recentSessions = recentResult?.count || 0;

  return {
    totalExercises,
    avgScore,
    types: ['邮件写作', '议论文', '创意写作'],
    recentSessions
  };
}

// 为内容统计单独提供一个GET接口
export async function GET() {
  try {
    const db = getDatabase();
    const contentStats = await getContentStats(db);
    
    // 获取按类型分组的内容统计
    const contentsByTypeQuery = `
      SELECT content_type, COUNT(*) as count 
      FROM learning_content 
      GROUP BY content_type
    `;
    const typeResults = db.prepare(contentsByTypeQuery).all() as { content_type?: string; count?: number }[];
    const contentsByType: Record<string, number> = {};
    typeResults.forEach(result => {
      if (result.content_type) {
        contentsByType[result.content_type] = result.count || 0;
      }
    });

    // 获取按难度分组的内容统计
    const contentsByDifficultyQuery = `
      SELECT difficulty_level, COUNT(*) as count 
      FROM learning_content 
      GROUP BY difficulty_level
    `;
    const difficultyResults = db.prepare(contentsByDifficultyQuery).all() as { difficulty_level?: string; count?: number }[];
    const contentsByDifficulty: Record<string, number> = {};
    difficultyResults.forEach(result => {
      if (result.difficulty_level) {
        contentsByDifficulty[result.difficulty_level] = result.count || 0;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        ...contentStats,
        contentsByType,
        contentsByDifficulty
      }
    });
  } catch (error) {
    console.error('获取内容统计失败:', error);
    return NextResponse.json({ error: '获取统计失败' }, { status: 500 });
  }
}