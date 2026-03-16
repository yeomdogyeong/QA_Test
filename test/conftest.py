import os
import csv
import pytest
from playwright.sync_api import Page
from datetime import datetime
import csv

BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:3000")
test_result = []


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


@pytest.hookimpl(hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()

    # 실제 테스트 본문 실행 결과만 저장
    if report.when == "call":
        error_message = ""

        if report.failed and call.excinfo is not None:
            error_message = str(call.excinfo.value)

        test_result.append(
            {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "test_name": item.name,
                "nodeid": item.nodeid,
                "outcome": report.outcome,  # passed / failed / skipped
                "duration_sec": round(report.duration, 4),
                "error_message": error_message,
            }
        )


def pytest_sessionfinish(session, exitstatus):
    os.makedirs("reports", exist_ok=True)
    file_path = os.path.join("reports", "test_results.csv")

    with open(file_path, mode="w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=[
                "timestamp",
                "test_name",
                "nodeid",
                "outcome",
                "duration_sec",
                "error_message",
            ],
        )
        writer.writeheader()
        writer.writerows(test_result)

    print(f"\n테스트 결과 CSV 저장 완료: {file_path}")
