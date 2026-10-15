# 에셋 폴더

파일을 넣기만 하면 코드 수정 없이 게임에 반영됩니다. 파일이 없으면 자동으로 대체 표현(이름 초상화, 합성음)이 쓰입니다.

| 폴더 | 용도 | 파일 이름 규칙 |
|---|---|---|
| `portraits/` | 인물 초상화 (권장 비율 4:5, 예: 400×500 PNG) | `data/scenario_1401.js`의 `family[].portrait` 값 (예: `taejong.png`) |
| `sounds/` | 효과음·배경음 (MP3) | `alert.mp3`, `alarm.mp3`, `battle.mp3`, `march.mp3`, `click.mp3` |
| `images/` | 사건 삽화, 지도 배경 등 | `data/events.js`의 `image` 값 (예: `events/famine.png` → `images/events/famine.png`) |

장군·대신 초상화를 추가하려면 시나리오 데이터에 인물을 추가하고 `portrait` 필드에 파일 이름을 적으면 됩니다.
