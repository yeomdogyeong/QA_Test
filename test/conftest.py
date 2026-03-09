import os
import pytest
from playwright.sync_api import Page


BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:3000")


@pytest.fixture
def app_url() -> str:
    return BASE_URL


@pytest.fixture(autouse=True)
def reset_storage_before_each_test(page: Page):
    # 앱이 로드되기 전에 localStorage 초기화
    page.add_init_script(
        """
        () => {
            localStorage.removeItem('mock_users');
            localStorage.removeItem('mock_logs');
        }
        """
    )


def login(page: Page, username: str, password: str, app_url: str):
    page.goto(app_url)
    page.locator("#username-input").fill(username)
    page.locator("#password-input").fill(password)
    page.locator("#login-button").click()