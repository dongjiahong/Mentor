import { PromptTemplates } from './PromptTemplates';
import { ContentValidator } from './ContentValidator';
import { 
  ContentGenerationParams, 
  ExamGenerationParams, 
  PronunciationEvaluationParams 
} from '@/types';

/**
 * 内容生成功能演示
 * 展示新的模板系统和验证器的功能
 */
export class ContentGenerationDemo {

  /**
   * 演示内容生成模板
   */
  static demoContentTemplates() {
    console.log('=== 内容生成模板演示 ===\n');

    // 演示不同类型的内容生成参数
    const contentParams: ContentGenerationParams[] = [
      {
        level: 'A1',
        goal: 'daily_conversation',
        type: 'dialogue',
        topic: '在餐厅点餐',
        wordCount: 150
      },
      {
        level: 'B2',
        goal: 'business_english',
        type: 'article',
        topic: '团队合作的重要性',
        wordCount: 300
      },
      {
        level: 'C1',
        goal: 'academic_english',
        type: 'article',
        topic: '人工智能的发展趋势'
      }
    ];

    contentParams.forEach((params, index) => {
      console.log(`--- 示例 ${index + 1}: ${params.level}水平${params.type === 'dialogue' ? '对话' : '文章'} ---`);
      console.log('参数:', JSON.stringify(params, null, 2));
      
      const systemPrompt = PromptTemplates.getContentSystemPrompt();
      const userPrompt = PromptTemplates.buildContentPrompt(params);
      
      console.log('\n系统提示词:');
      console.log(systemPrompt.substring(0, 200) + '...\n');
      
      console.log('用户提示词:');
      console.log(userPrompt.substring(0, 300) + '...\n');
      
      console.log('复杂度指导:');
      console.log(PromptTemplates.getComplexityGuidelines(params.level).substring(0, 150) + '...\n');
      
      console.log('---\n');
    });
  }

  /**
   * 演示考试题目生成模板
   */
  static demoExamTemplates() {
    console.log('=== 考试题目生成模板演示 ===\n');

    const examParams: ExamGenerationParams[] = [
      {
        level: 'A2',
        examType: 'vocabulary',
        questionCount: 5,
        words: [
          {
            id: 1,
            word: 'apple',
            definition: '苹果',
            addReason: 'translation_lookup',
            proficiencyLevel: 2,
            reviewCount: 3,
            createdAt: new Date()
          }
        ]
      },
      {
        level: 'B1',
        examType: 'pronunciation',
        questionCount: 3
      },
      {
        level: 'C1',
        examType: 'comprehension',
        questionCount: 8
      }
    ];

    examParams.forEach((params, index) => {
      console.log(`--- 示例 ${index + 1}: ${params.level}水平${params.examType}考试 ---`);
      console.log('参数:', JSON.stringify(params, null, 2));
      
      const systemPrompt = PromptTemplates.getExamSystemPrompt();
      const userPrompt = PromptTemplates.buildExamPrompt(params);
      
      console.log('\n系统提示词:');
      console.log(systemPrompt.substring(0, 200) + '...\n');
      
      console.log('用户提示词:');
      console.log(userPrompt.substring(0, 300) + '...\n');
      
      console.log('---\n');
    });
  }

  /**
   * 演示发音评估模板
   */
  static demoPronunciationTemplates() {
    console.log('=== 发音评估模板演示 ===\n');

    const pronunciationParams: PronunciationEvaluationParams[] = [
      {
        originalText: 'Hello, how are you today?',
        spokenText: 'Hello, how are you today?'
      },
      {
        originalText: 'I would like to order a coffee, please.',
        spokenText: 'I would like to order a coffee please',
        word: 'coffee'
      },
      {
        originalText: 'The weather is beautiful today.',
        spokenText: 'The weather is beatiful today'
      }
    ];

    pronunciationParams.forEach((params, index) => {
      console.log(`--- 示例 ${index + 1}: 发音评估 ---`);
      console.log('参数:', JSON.stringify(params, null, 2));
      
      const systemPrompt = PromptTemplates.getPronunciationSystemPrompt();
      const userPrompt = PromptTemplates.buildPronunciationPrompt(params);
      
      console.log('\n系统提示词:');
      console.log(systemPrompt.substring(0, 200) + '...\n');
      
      console.log('用户提示词:');
      console.log(userPrompt.substring(0, 300) + '...\n');
      
      console.log('---\n');
    });
  }

  /**
   * 演示内容验证功能
   */
  static demoContentValidation() {
    console.log('=== 内容验证演示 ===\n');

    // 测试有效内容
    const validContent = {
      originalText: 'Hello, how can I help you today? I am here to assist you with your shopping needs. What are you looking for?',
      translation: '你好，今天我能为您做些什么？我在这里帮助您满足购物需求。您在寻找什么？',
      topic: 'Shopping',
      wordCount: 23,
      estimatedReadingTime: 1
    };

    const validParams: ContentGenerationParams = {
      level: 'B1',
      goal: 'daily_conversation',
      type: 'dialogue',
      topic: 'Shopping'
    };

    console.log('--- 有效内容验证 ---');
    const validResult = ContentValidator.validateLearningContent(validContent, validParams);
    console.log('验证结果:', validResult);
    console.log();

    // 测试无效内容
    const invalidContent = {
      originalText: 'Hi.',
      translation: '你好。',
      topic: 'Shopping'
    };

    console.log('--- 无效内容验证 ---');
    const invalidResult = ContentValidator.validateLearningContent(invalidContent, validParams);
    console.log('验证结果:', invalidResult);
    console.log();

    // 测试JSON解析
    console.log('--- JSON解析测试 ---');
    const jsonTests = [
      '{"originalText": "Hello", "translation": "你好"}',
      '```json\n{"originalText": "Hello", "translation": "你好"}\n```',
      'Some text before {"originalText": "Hello", "translation": "你好"} some text after',
      '{"invalid": json}'
    ];

    jsonTests.forEach((json, index) => {
      console.log(`测试 ${index + 1}:`, json.substring(0, 50) + '...');
      const result = ContentValidator.safeJsonParse(json);
      console.log('解析结果:', result.success ? '成功' : `失败: ${result.error}`);
      console.log();
    });
  }

  /**
   * 运行所有演示
   */
  static runAllDemos() {
    console.log('🚀 内容生成功能完整演示\n');
    
    this.demoContentTemplates();
    this.demoExamTemplates();
    this.demoPronunciationTemplates();
    this.demoContentValidation();
    
    console.log('✅ 演示完成！');
    console.log('\n📝 总结:');
    console.log('- PromptTemplates: 提供结构化的提示词模板系统');
    console.log('- ContentValidator: 提供内容格式和质量验证');
    console.log('- 支持多种英语水平和学习目标');
    console.log('- 包含完整的错误处理和边界情况处理');
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  ContentGenerationDemo.runAllDemos();
}

export default ContentGenerationDemo;