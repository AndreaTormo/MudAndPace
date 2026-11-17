const { z } = require('zod');

const historyItemSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(1000)
}).strict();

const chatSchema = z.object({
  message: z.string().trim().min(1, 'El mensaje es obligatorio').max(1000, 'El mensaje no puede superar los 1000 caracteres'),
  history: z.array(historyItemSchema).max(10).optional()
}).strict();

module.exports = { chatSchema };
