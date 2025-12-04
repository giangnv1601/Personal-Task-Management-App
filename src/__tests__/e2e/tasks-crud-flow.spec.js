import { test, expect } from '@playwright/test'
import dotenv from 'dotenv'

dotenv.config()
const TEST_EMAIL = process.env.PW_TEST_EMAIL
const TEST_PASSWORD = process.env.PW_TEST_PASSWORD

test('login → create → update → delete task flow', async ({ page }) => {
  const taskTitle = `E2E Task ${Date.now()}`
  const updatedTitle = `${taskTitle} (đã sửa)`

  // ===== LOGIN =====
  await page.goto('/login')

  await page.getByLabel('Email').fill(TEST_EMAIL)
  await page.getByLabel('Mật khẩu').fill(TEST_PASSWORD)
  await page.getByRole('button', { name: 'Đăng nhập' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Dashboard' }),
  ).toBeVisible()

  // ===== CREATE TASK =====
  await page.goto('/tasks')

  await expect(
    page.getByRole('heading', { name: 'Danh sách Task' }),
  ).toBeVisible()

  await page.getByRole('link', { name: 'Tạo mới task' }).click()

  await expect(
    page.getByRole('heading', { name: 'Tạo mới Task' }),
  ).toBeVisible()

  // Title + mô tả
  await page.getByLabel('Tên task').fill(taskTitle)
  await page.getByLabel('Mô tả').fill('Task được tạo bằng E2E test')

  // Priority (select name="priority")
  await page.locator('select[name="priority"]').selectOption('high') // High

  // Status (select name="status")
  await page.locator('select[name="status"]').selectOption('in_progress') // Đang làm

  // Checklist: thêm 1 item và tick done
  await page.getByRole('button', { name: '+ Thêm checklist' }).click()
  const checklistText = page.locator('input[name^="checklist"][name$=".text"]').first()
  await checklistText.fill('Subtask từ e2e test')
  const checklistDone = page.locator('input[name^="checklist"][name$=".done"]').first()
  await checklistDone.check()

  // Attachment URL
  await page.getByLabel('Đính kèm (URL)').fill('https://example.com/e2e-doc')

  // Deadline: input datetime-local (tương lai)
  await page.locator('input[type="datetime-local"]').fill('2030-01-01T10:00')

  // Submit
  await page.getByRole('button', { name: 'Tạo mới' }).click()

  await expect(page.getByText('Tạo task thành công!')).toBeVisible()

  // ===== KIỂM TRA TASK MỚI TRONG LIST =====
  await page.goto('/tasks')

  // Đảm bảo task mới xuất hiện trong list
  await expect(page.getByText(taskTitle)).toBeVisible()

  // (tuỳ chọn) kiểm tra Priority / Deadline hiển thị đúng trong row
  const createdRow = page
    .getByRole('checkbox', { name: `Hoàn thành task: ${taskTitle}` })
    .locator('..') // lên wrapper chứa checkbox + title
    .locator('..') // lên wrapper của cả row

  await expect(createdRow.getByText('High')).toBeVisible()
  await expect(createdRow.getByText('01/01/2030 10:00')).toBeVisible()


  // ===== UPDATE TASK =====
  await page
    .getByRole('link', { name: `Sửa task ${taskTitle}` })
    .click()

  await expect(
    page.getByRole('heading', { name: 'Cập nhật Task' }),
  ).toBeVisible()

  // --- UPDATE: sửa nhiều trường ---
  // Tiêu đề
  const titleInput = page.getByLabel('Tên task')
  await expect(titleInput).toBeVisible()
  await titleInput.fill(updatedTitle)

  // Mô tả
  await page.getByLabel('Mô tả').fill('Mô tả đã được sửa bởi e2e test')

  // Status → Hoàn thành
  await page.locator('select[name="status"]').selectOption('done')

  // Priority → Medium
  await page.locator('select[name="priority"]').selectOption('medium')

  // Deadline → đổi sang 2031
  await page.locator('input[type="datetime-local"]').fill('2031-01-01T12:00')

  // Attachment URL → đổi link (dùng name hoặc placeholder ổn định)
  const attachmentInput = page.locator('input[name="attachment_url"]')
  await attachmentInput.fill('https://example.com/e2e-updated')


  // Checklist: (ví dụ) bỏ tick done của item đầu
  const updateChecklistDone = page.locator('input[name^="checklist"][name$=".done"]').first()
  await updateChecklistDone.uncheck()

  // Cập nhật -> confirm dialog
  await page.getByRole('button', { name: 'Cập nhật' }).click()
  await page.getByRole('button', { name: 'Lưu' }).click()

  await expect(
    page.getByText('Cập nhật task thành công!'),
  ).toBeVisible()

  // Quay lại /tasks kiểm tra một số field đã đổi
  await page.goto('/tasks')

  const updatedRow = page
    .getByRole('checkbox', { name: `Hoàn thành task: ${updatedTitle}` })
    .locator('..')
    .locator('..')

  await expect(updatedRow).toBeVisible()
  await expect(updatedRow.getByText('Medium')).toBeVisible()
  await expect(updatedRow.getByText('01/01/2031 12:00')).toBeVisible()


  // ===== DELETE TASK =====
  await page
    .getByRole('link', { name: `Sửa task ${updatedTitle}` })
    .click()

  await page.getByRole('button', { name: 'Xoá task' }).click()
  await page.getByRole('button', { name: 'Xóa' }).click()

  await expect(page.getByText('Đã xóa task')).toBeVisible()

  await page.goto('/tasks')
  await expect(page.getByText(updatedTitle)).not.toBeVisible()
})
