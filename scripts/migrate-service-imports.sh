#!/bin/bash

# 服务层重构后的导入路径迁移脚本

echo "开始迁移服务导入路径..."

# 定义迁移规则
declare -A migrations=(
    ["@/services/storage/StorageService"]="@/services/core"
    ["@/services/initialization/InitializationService"]="@/services/core"
    ["@/services/database/schema"]="@/services/core"
    ["@/services/writing-prompts/WritingPromptsService"]="@/services/practice"
    ["@/services/WritingEvaluationService"]="@/services/practice"
    ["@/services/wordbook/WordbookService"]="@/services/user"
    ["@/services/wordbook/MemoryAlgorithm"]="@/services/user"
    ["@/services/learning-records/LearningRecordsService"]="@/services/user"
    ["@/services/learning-records/LearningRecordsClientService"]="@/services/user"
    ["@/services/content/ContentManager"]="@/services/content"
    ["@/services/learning-content/LearningContentService"]="@/services/content"
    ["@/services/dictionary/DictionaryService"]="@/services/language"
    ["@/services/dictionary/DictionaryConfig"]="@/services/language"
    ["@/services/speech/SpeechService"]="@/services/language"
    ["@/services/pronunciation/PronunciationEvaluator"]="@/services/language"
    ["@/services/ai/AIService"]="@/services/ai"
    ["@/services/ai/PromptTemplates"]="@/services/ai"
    ["@/services/ai/ContentValidator"]="@/services/ai"
)

# 相对路径迁移
declare -A relative_migrations=(
    ["from '../storage/StorageService'"]="from '../../core/storage/StorageService'"
    ["from './storage/StorageService'"]="from '../core/storage/StorageService'"
)

# 应用绝对路径迁移
for old_path in "${!migrations[@]}"; do
    new_path="${migrations[$old_path]}"
    echo "迁移: $old_path -> $new_path"
    
    find /home/ubuntu/Mentor -name "*.ts" -o -name "*.tsx" | \
    xargs grep -l "$old_path" | \
    xargs sed -i "s|$old_path|$new_path|g"
done

# 应用相对路径迁移
for old_path in "${!relative_migrations[@]}"; do
    new_path="${relative_migrations[$old_path]}"
    echo "迁移相对路径: $old_path -> $new_path"
    
    find /home/ubuntu/Mentor -name "*.ts" -o -name "*.tsx" | \
    xargs grep -l "$old_path" | \
    xargs sed -i "s|$old_path|$new_path|g"
done

echo "导入路径迁移完成！"

# 检查类型错误
echo "正在检查TypeScript类型..."
if yarn type-check; then
    echo "✅ 类型检查通过"
else
    echo "⚠️  仍有一些类型错误，请手动修复"
fi