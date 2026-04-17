export const saveToGoogleDrive = async (plannerData) => {
    try {
      const response = await fetch('/api/save-to-drive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...plannerData,
          timestamp: new Date().toISOString(),
          source: 'planner-app'
        })
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ Google Drive에 저장 완료!\n파일 ID: ${result.fileId}`);
        return result;
      } else {
        alert('❌ 저장 실패: ' + result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Google Drive 저장 오류:', error);
      alert('❌ 저장 중 네트워크 오류가 발생했습니다.');
      throw error;
    }
  };
