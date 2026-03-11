import re
from playwright.sync_api import Page, expect
from conftest import login


def test_01_admin_login_success(page: Page, app_url: str):
    login(page, "admin", "Admin123!", app_url)

    expect(page.get_by_text("시스템 현황")).to_be_visible()
    expect(page.get_by_text("관리자")).to_be_visible()
    expect(page.locator("#logout-button")).to_be_visible()


def test_02_password_policy_validation(page: Page, app_url: str):
    page.goto(app_url)
    page.locator("#username-input").fill("admin")
    page.locator("#password-input").fill("1234")
    page.locator("#login-button").click()

    expect(page.locator("#error-message")).to_have_text(
        "비밀번호는 최소 8자 이상이며, 숫자와 특수문자를 포함해야 합니다."
    )


def test_03_account_lock_after_five_failed_attempts(page: Page, app_url: str):
    page.goto(app_url)

    # 정책 통과하는 '틀린' 비밀번호 사용
    wrong_password = "Wrong123!"

    for _ in range(5):
        page.locator("#username-input").fill("user1")
        page.locator("#password-input").fill(wrong_password)
        page.locator("#login-button").click()
        expect(page.locator("#error-message")).to_have_text(
            "아이디 또는 비밀번호가 올바르지 않습니다."
        )

    # 6번째 시도: 정상 비밀번호를 넣어도 잠금 상태여야 함
    page.locator("#username-input").fill("user1")
    page.locator("#password-input").fill("User123!")
    page.locator("#login-button").click()

    expect(page.locator("#error-message")).to_have_text(
        "계정이 잠겼습니다. 나중에 다시 시도하세요."
    )


def test_04_role_based_menu_visibility(page: Page, app_url: str):
    # User 권한
    login(page, "user1", "User123!", app_url)

    expect(page.get_by_role("button", name="대시보드")).to_be_visible()
    expect(page.get_by_role("button", name="개인 정보")).to_be_visible()
    expect(page.get_by_role("button", name="사용자 관리")).to_have_count(0)
    expect(page.get_by_role("button", name="액세스 로그")).to_have_count(0)

    page.locator("#logout-button").click()

    # Auditor 권한
    login(page, "audit", "Audit123!", app_url)

    expect(page.get_by_role("button", name="대시보드")).to_be_visible()
    expect(page.get_by_role("button", name="개인 정보")).to_be_visible()
    expect(page.get_by_role("button", name="사용자 관리")).to_have_count(0)
    expect(page.get_by_role("button", name="액세스 로그")).to_be_visible()


def test_05_admin_create_and_delete_user_with_log_check(page: Page, app_url: str):
    login(page, "admin", "Admin123!", app_url)

    # 사용자 관리 탭 이동
    page.get_by_role("button", name="사용자 관리").click()

    # 사용자 생성
    page.locator("#create-user-button").click()
    page.locator("#new-username").fill("tester01")
    page.locator("#new-password").fill("Tester123!")
    page.locator("#new-name").fill("테스터")
    page.locator("#new-email").fill("tester01@example.com")
    page.locator("#new-phone").fill("010-1111-2222")
    page.locator("#new-role").select_option("User")

    page.once("dialog", lambda dialog: dialog.accept())
    page.locator("#submit-user-button").click()

    # 사용자 테이블에 반영 확인
    expect(page.locator("#user-table")).to_contain_text("tester01")
    expect(page.locator("#user-table")).to_contain_text("테스터")

    # 액세스 로그 확인
    page.get_by_role("button", name="액세스 로그").click()
    expect(page.locator("#log-table")).to_contain_text("사용자 생성: tester01")

    # 다시 사용자 관리로 이동 후 삭제
    page.get_by_role("button", name="사용자 관리").click()

    row = page.locator("#user-table tbody tr").filter(has_text="tester01")
    delete_button = row.locator("button")

    page.once("dialog", lambda dialog: dialog.accept())
    page.once("dialog", lambda dialog: dialog.accept())
    delete_button.click()

    expect(page.locator("#user-table")).not_to_contain_text("tester01")

    # 삭제 로그 확인
    page.get_by_role("button", name="액세스 로그").click()
    expect(page.locator("#log-table")).to_contain_text("사용자 삭제: tester01")