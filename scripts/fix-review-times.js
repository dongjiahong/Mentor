#!/usr/bin/env node

/**
 * 修复单词本中 next_review_at 为 NULL 的数据
 * 根据单词的创建时间和当前熟练度设置合理的复习时间
 */

const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// 数据库路径
const dbPath = path.join(__dirname, '../data/mentor.db');

// 检查数据库文件是否存在
if (!fs.existsSync(dbPath)) {
  console.log('❌ 数据库文件不存在:', dbPath);
  console.log('请确保应用至少运行过一次以创建数据库文件');
  process.exit(1);
}

// 复习间隔配置（基于熟练度等级）
const reviewIntervals = {
  0: 1,    // 1天后
  1: 3,    // 3天后  
  2: 7,    // 7天后
  3: 14,   // 14天后
  4: 30,   // 30天后
  5: 90    // 90天后（已掌握）
};

function fixReviewTimes() {
  console.log('🔧 开始修复单词本复习时间...');
  
  try {
    // 连接数据库
    const db = sqlite3(dbPath);
    
    // 查找所有 next_review_at 为 NULL 的单词
    const nullReviewWords = db.prepare(`
      SELECT id, word, proficiency_level, created_at 
      FROM wordbook 
      WHERE next_review_at IS NULL
    `).all();
    
    console.log(`📋 找到 ${nullReviewWords.length} 个需要修复的单词`);
    
    if (nullReviewWords.length === 0) {
      console.log('✅ 所有单词的复习时间都已设置，无需修复');
      db.close();
      return;
    }
    
    // 准备更新语句
    const updateStmt = db.prepare(`
      UPDATE wordbook 
      SET next_review_at = datetime('now', '+' || ? || ' days')
      WHERE id = ?
    `);
    
    let updatedCount = 0;
    const transaction = db.transaction(() => {
      for (const word of nullReviewWords) {
        const proficiencyLevel = word.proficiency_level || 0;
        const intervalDays = reviewIntervals[proficiencyLevel] || 1;
        
        // 计算下次复习时间
        // 对于旧单词，使用创建时间加上间隔，但不早于当前时间
        const createdAt = new Date(word.created_at);
        const now = new Date();
        const suggestedReviewTime = new Date(createdAt.getTime() + intervalDays * 24 * 60 * 60 * 1000);
        
        // 如果建议的复习时间已经过去，则设置为从现在开始的间隔时间
        let finalInterval;
        if (suggestedReviewTime < now) {
          // 对于过期单词，根据熟练度设置较短的复习间隔
          if (proficiencyLevel <= 1) {
            finalInterval = 0.5; // 12小时后
          } else if (proficiencyLevel <= 2) {
            finalInterval = 1;   // 1天后
          } else {
            finalInterval = intervalDays; // 按正常间隔
          }
        } else {
          finalInterval = intervalDays;
        }
        
        try {
          updateStmt.run(finalInterval, word.id);
          updatedCount++;
          console.log(`  ✓ ${word.word} (熟练度: ${proficiencyLevel}, 间隔: ${finalInterval}天)`);
        } catch (error) {
          console.error(`  ✗ 更新失败 ${word.word}:`, error.message);
        }
      }
    });
    
    transaction();
    
    console.log(`✅ 成功修复 ${updatedCount} 个单词的复习时间`);
    
    // 验证修复结果
    const remainingNullCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM wordbook 
      WHERE next_review_at IS NULL
    `).get().count;
    
    console.log(`📊 修复后仍有 ${remainingNullCount} 个单词的复习时间为空`);
    
    // 显示需要复习的单词统计
    const needReviewCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM wordbook 
      WHERE next_review_at <= datetime('now')
    `).get().count;
    
    console.log(`📅 当前需要复习的单词数量: ${needReviewCount}`);
    
    db.close();
    console.log('🎉 数据修复完成！');
    
  } catch (error) {
    console.error('❌ 修复过程中出现错误:', error);
    process.exit(1);
  }
}

// 运行修复脚本
fixReviewTimes();