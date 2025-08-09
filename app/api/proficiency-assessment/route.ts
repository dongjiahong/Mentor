import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { ProficiencyAssessmentService } from '@/services/assessment/ProficiencyAssessmentService';

// 强制动态渲染
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    const db = getDatabase();
    const assessmentService = new ProficiencyAssessmentService(db);

    switch (action) {
      case 'assess_proficiency':
        return handleAssessProficiency(assessmentService);
      case 'get_upgrade_recommendations':
        return handleGetUpgradeRecommendations(assessmentService);
      case 'check_level_requirements':
        return handleCheckLevelRequirements(assessmentService, data);
      default:
        return NextResponse.json({ error: '未知操作' }, { status: 400 });
    }
  } catch (error) {
    console.error('能力评估API错误:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

async function handleAssessProficiency(assessmentService: ProficiencyAssessmentService) {
  try {
    const assessment = await assessmentService.assessProficiency();
    const recommendations = assessmentService.generateUpgradeRecommendations(assessment);

    return NextResponse.json({
      success: true,
      data: {
        assessment,
        recommendations
      }
    });
  } catch (error) {
    console.error('能力评估失败:', error);
    return NextResponse.json({ error: '能力评估失败' }, { status: 500 });
  }
}

async function handleGetUpgradeRecommendations(assessmentService: ProficiencyAssessmentService) {
  try {
    const assessment = await assessmentService.assessProficiency();
    const recommendations = assessmentService.generateUpgradeRecommendations(assessment);

    return NextResponse.json({
      success: true,
      data: {
        currentLevel: assessment.overallLevel,
        canUpgrade: assessment.levelUpgrade.canUpgrade,
        nextLevel: assessment.levelUpgrade.nextLevel,
        progress: assessment.levelUpgrade.overallProgress,
        requirements: assessment.levelUpgrade.requirements,
        recommendations,
        moduleStrengths: {
          strongest: assessment.strongestModule,
          weakest: assessment.weakestModule
        }
      }
    });
  } catch (error) {
    console.error('获取升级建议失败:', error);
    return NextResponse.json({ error: '获取升级建议失败' }, { status: 500 });
  }
}

interface CheckLevelRequirementsData {
  targetLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

async function handleCheckLevelRequirements(
  assessmentService: ProficiencyAssessmentService, 
  data: CheckLevelRequirementsData
) {
  try {
    const assessment = await assessmentService.assessProficiency();
    
    // 如果指定了目标级别，检查达到该级别的要求
    // 否则检查下一级别的要求
    const targetLevel = data.targetLevel || assessment.levelUpgrade.nextLevel;
    
    if (!targetLevel) {
      return NextResponse.json({
        success: true,
        data: {
          message: '您已经达到最高级别 C2',
          currentLevel: assessment.overallLevel,
          allRequirementsMet: true
        }
      });
    }

    const requirements = assessment.levelUpgrade.requirements;
    const metCount = requirements.filter(req => req.met).length;
    const totalCount = requirements.length;
    
    return NextResponse.json({
      success: true,
      data: {
        currentLevel: assessment.overallLevel,
        targetLevel,
        requirements,
        progress: {
          metRequirements: metCount,
          totalRequirements: totalCount,
          percentage: Math.round((metCount / totalCount) * 100)
        },
        canUpgrade: assessment.levelUpgrade.canUpgrade,
        estimatedTimeToUpgrade: estimateUpgradeTime(requirements),
        priorityAreas: identifyPriorityAreas(requirements)
      }
    });
  } catch (error) {
    console.error('检查级别要求失败:', error);
    return NextResponse.json({ error: '检查级别要求失败' }, { status: 500 });
  }
}

// 估算升级所需时间（基于当前差距）
function estimateUpgradeTime(requirements: any[]): string {
  let totalGap = 0;
  let moduleCount = 0;

  requirements.forEach(req => {
    if (!req.met) {
      const accuracyGap = Math.max(0, req.requiredAccuracy - req.currentAccuracy);
      const attemptGap = Math.max(0, req.minimumAttempts - req.currentAttempts);
      
      // 估算每个模块的差距程度
      const accuracyGapScore = accuracyGap / 10; // 10%差距 = 1分
      const attemptGapScore = attemptGap / 5; // 5次练习 = 1分
      
      totalGap += accuracyGapScore + attemptGapScore;
      moduleCount++;
    }
  });

  if (totalGap === 0) {
    return '已达到升级要求';
  }

  // 根据差距估算时间
  if (totalGap <= 2) return '1-2周';
  if (totalGap <= 4) return '3-4周';
  if (totalGap <= 6) return '1-2个月';
  if (totalGap <= 10) return '2-3个月';
  return '3个月以上';
}

// 识别优先改进的领域
function identifyPriorityAreas(requirements: any[]): string[] {
  const priorities: string[] = [];
  
  // 找出差距最大的模块
  let maxGap = 0;
  let criticalModule = '';
  
  requirements.forEach(req => {
    if (!req.met) {
      const accuracyGap = Math.max(0, req.requiredAccuracy - req.currentAccuracy);
      if (accuracyGap > maxGap) {
        maxGap = accuracyGap;
        criticalModule = req.module;
      }
    }
  });

  const moduleNames = {
    reading: '阅读理解',
    listening: '听力理解',
    speaking: '口语表达',
    writing: '写作能力'
  };

  if (criticalModule) {
    priorities.push(`重点提升${moduleNames[criticalModule as keyof typeof moduleNames]}`);
  }

  // 基于模块特点给出通用建议
  requirements.forEach(req => {
    if (!req.met) {
      switch (req.module) {
        case 'reading':
          priorities.push('增加阅读练习，提高理解速度和准确率');
          break;
        case 'listening':
          priorities.push('多听英语音频，训练听力理解能力');
          break;
        case 'speaking':
          priorities.push('加强口语练习，重点训练发音准确度');
          break;
        case 'writing':
          priorities.push('练习写作，注重语法和词汇运用');
          break;
      }
    }
  });

  return priorities.slice(0, 3); // 最多返回3个优先建议
}