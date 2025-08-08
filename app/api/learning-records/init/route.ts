import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// 强制动态渲染，避免在构建时执行数据库操作
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const db = getDatabase();

    // 添加一些示例单词到单词本
    const insertWordStmt = db.prepare(`
      INSERT OR IGNORE INTO wordbook (word, definition, pronunciation, add_reason, proficiency_level, review_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleWords = [
      ['hello', '你好', '/həˈloʊ/', 'translation_lookup', 5, 10],
      ['world', '世界', '/wɜːrld/', 'translation_lookup', 4, 8],
      ['example', '例子', '/ɪɡˈzæmpəl/', 'pronunciation_error', 3, 5],
      ['learning', '学习', '/ˈlɜːrnɪŋ/', 'translation_lookup', 4, 7],
      ['practice', '练习', '/ˈpræktɪs/', 'listening_difficulty', 3, 6],
      ['improve', '改善', '/ɪmˈpruːv/', 'translation_lookup', 4, 9],
      ['language', '语言', '/ˈlæŋɡwɪdʒ/', 'translation_lookup', 5, 12],
      ['study', '学习', '/ˈstʌdi/', 'pronunciation_error', 4, 8],
      ['progress', '进步', '/ˈprɑːɡres/', 'translation_lookup', 3, 4],
      ['achievement', '成就', '/əˈtʃiːvmənt/', 'listening_difficulty', 2, 3]
    ];

    const now = new Date().toISOString();
    sampleWords.forEach(([word, definition, pronunciation, addReason, proficiencyLevel, reviewCount]) => {
      insertWordStmt.run(word, definition, pronunciation, addReason, proficiencyLevel, reviewCount, now);
    });

    // 添加一些示例学习记录
    const insertRecordStmt = db.prepare(`
      INSERT INTO learning_records (activity_type, word, accuracy_score, time_spent, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    const sampleRecords = [
      ['reading', null, 85, 300, new Date(Date.now() - 1000 * 60 * 30).toISOString()], // 30分钟前
      ['speaking', 'hello', 92, 120, new Date(Date.now() - 1000 * 60 * 45).toISOString()], // 45分钟前
      ['listening', null, 78, 180, new Date(Date.now() - 1000 * 60 * 60).toISOString()], // 1小时前
      ['translation', 'example', 88, 90, new Date(Date.now() - 1000 * 60 * 90).toISOString()], // 1.5小时前
      ['reading', null, 91, 420, new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()], // 2小时前
      ['speaking', 'world', 87, 150, new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()], // 3小时前
      ['listening', null, 82, 240, new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()], // 4小时前
      ['translation', 'learning', 95, 75, new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()], // 5小时前
    ];

    sampleRecords.forEach(([activityType, word, accuracyScore, timeSpent, createdAt]) => {
      insertRecordStmt.run(activityType, word, accuracyScore, timeSpent, createdAt);
    });

    return NextResponse.json({
      success: true,
      message: '示例数据初始化完成',
      data: {
        wordsAdded: sampleWords.length,
        recordsAdded: sampleRecords.length
      }
    });
  } catch (error) {
    console.error('初始化示例数据失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: '初始化失败' 
    }, { status: 500 });
  }
}