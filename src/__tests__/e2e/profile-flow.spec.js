import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

import { test, expect } from "@playwright/test"
import dotenv from "dotenv"

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TEST_EMAIL = process.env.PW_TEST_EMAIL
const TEST_PASSWORD = process.env.PW_TEST_PASSWORD
const NEW_PASSWORD = process.env.PW_TEST_NEW_PASSWORD

// Helper delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

test("login -> profile -> update profile -> change password -> revert password", async ({ page }) => {
  const newName = `E2E User`
  const avatarPath = path.join(__dirname, "fixtures", "user.webp")

  if (!fs.existsSync(avatarPath)) {
    throw new Error(`Fixture not found: ${avatarPath}`)
  }

  // ========== LOGIN ==========
  await page.goto("/login")
  await delay(500)
  
  await page.getByLabel("Email").fill(TEST_EMAIL)
  await page.getByLabel("Mật khẩu").fill(TEST_PASSWORD)
  await delay(300)
  
  await page.getByRole("button", { name: "Đăng nhập" }).click()
  
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "Dashboard" })
  ).toBeVisible()
  await delay(1000)

  // ========== PROFILE ==========
  await page.goto("/profile")
  await delay(800)
  
  await expect(
    page.getByRole("heading", { name: "Hồ sơ cá nhân" })
  ).toBeVisible()
  
  await expect(
    page.getByRole("button", { name: "Sửa thông tin" })
  ).toBeVisible()
  await delay(800)

  // ========== UPDATE PROFILE ==========
  await page.getByRole("button", { name: "Sửa thông tin" }).click()
  
  await expect(page).toHaveURL(/\/profile\/edit/)
  await delay(800)
  
  const nameInput = page.getByLabel("Họ tên")
  await expect(nameInput).toBeVisible()
  await nameInput.fill(newName)
  await delay(500)
  
  const fileInput = page.locator('input[type="file"]')
  await fileInput.setInputFiles(avatarPath)
  await delay(1000)
  
  const saveBtn = page.getByRole("button", { name: "Lưu thay đổi" })
  await expect(saveBtn).toBeEnabled({ timeout: 5000 })
  await saveBtn.click()
  
  await expect(page.getByText("Cập nhật hồ sơ thành công!")).toBeVisible()
  await delay(500)
  
  await expect(page).toHaveURL("/profile")
  await delay(800)
  
  await expect(page.getByText(newName)).toBeVisible()
  await delay(1000)

  // ========== CHANGE PASSWORD ==========
  await page.getByRole("button", { name: "Đổi mật khẩu" }).click()
  
  await expect(page).toHaveURL("/change-password")
  await delay(800)
  
  await page.getByLabel("Mật khẩu hiện tại").fill(TEST_PASSWORD)
  await delay(300)
  
  await page.getByLabel(/^Mật khẩu mới$/).fill(NEW_PASSWORD)
  await delay(300)
  
  await page.getByLabel("Nhập lại mật khẩu mới").fill(NEW_PASSWORD)
  await delay(500)
  
  const savePwBtn = page.getByRole("button", { name: "Lưu mật khẩu mới" })
  await expect(savePwBtn).toBeEnabled()
  await savePwBtn.click()
  
  await expect(page.getByText("Đổi mật khẩu thành công")).toBeVisible()
  await delay(500)
  
  await expect(page.getByLabel("Mật khẩu hiện tại")).toHaveValue("")
  await delay(1000)

  // ========== REVERT PASSWORD ==========
  await page.getByLabel("Mật khẩu hiện tại").fill(NEW_PASSWORD)
  await delay(300)
  
  await page.getByLabel(/^Mật khẩu mới$/).fill(TEST_PASSWORD)
  await delay(300)
  
  await page.getByLabel("Nhập lại mật khẩu mới").fill(TEST_PASSWORD)
  await delay(500)
  
  await savePwBtn.click()
  
  await expect(page.getByText("Đổi mật khẩu thành công")).toBeVisible()
  await delay(500)
  
  await expect(page.getByLabel("Mật khẩu hiện tại")).toHaveValue("")
  await delay(800)
})
