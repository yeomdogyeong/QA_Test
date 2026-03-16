import os
import csv
import pytest
from playwright.sync_api import Page
from datetime import datetime


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


# pytest 내부 이벤트에 코드 삽입 가능
@pytest.hookimpl(hookwrapper=True)
# item = 테스트 정보 / call = 실행 결과 정보
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()

    # 실제 테스트 본문 실행 결과만 저장
    if report.when == "call":
        error_message = ""
        screenshot_path = ""

        if report.failed and call.excinfo is not None:
            error_message = str(call.excinfo.value)
            page = item.funcargs.get("page", None)

            if page:
                os.makedirs("reports/screenshots", exist_ok=True)

                screenshot_path = os.path.join(
                    "reports",
                    "screenshots",
                    f"{item.name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png",
                )

                page.screenshot(path=screenshot_path)

        test_result.append(
            {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "test_name": item.name,
                "nodeid": item.nodeid,
                "outcome": report.outcome,  # passed / failed / skipped
                "duration_sec": round(report.duration, 4),
                "error_message": error_message,
                "screenshot": "",
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
                "screenshot",
            ],
        )
        writer.writeheader()
        writer.writerows(test_result)

    print(f"\n테스트 결과 CSV 저장 완료: {file_path}")
