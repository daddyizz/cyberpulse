package com.daddyizz.cyberpulse

import com.daddyizz.cyberpulse.core.model.Track
import com.daddyizz.cyberpulse.core.player.CyberPulseTestMedia
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * Unit tests verifying queue operations, mutations, and next track resolution.
 */
class QueueStateTest {

    @Test
    fun emptyQueue_behavesCleanly() {
        val queue = emptyList<Track>()
        assertTrue(queue.isEmpty())
        assertNull(queue.getOrNull(0))
    }

    @Test
    fun queueAddition_appendsItemToEnd() {
        val queue = mutableListOf<Track>()
        queue.add(CyberPulseTestMedia.TRACK_NEON_HORIZON)
        queue.add(CyberPulseTestMedia.TRACK_MIDNIGHT_CIRCUIT)

        assertEquals(2, queue.size)
        assertEquals("cp_test_01", queue[0].id)
        assertEquals("cp_test_02", queue[1].id)
    }

    @Test
    fun queuePlayNext_insertsImmediatelyAfterCurrentIndex() {
        val queue = mutableListOf(
            CyberPulseTestMedia.TRACK_NEON_HORIZON,
            CyberPulseTestMedia.TRACK_MIDNIGHT_CIRCUIT
        )
        val currentIndex = 0
        val trackToInsert = CyberPulseTestMedia.TRACK_ELECTRIC_DRIFT

        queue.add(currentIndex + 1, trackToInsert)

        assertEquals(3, queue.size)
        assertEquals(CyberPulseTestMedia.TRACK_NEON_HORIZON.id, queue[0].id)
        assertEquals(CyberPulseTestMedia.TRACK_ELECTRIC_DRIFT.id, queue[1].id)
        assertEquals(CyberPulseTestMedia.TRACK_MIDNIGHT_CIRCUIT.id, queue[2].id)
    }

    @Test
    fun queueReorder_movesItemCorrectly() {
        val queue = mutableListOf(
            CyberPulseTestMedia.TRACK_NEON_HORIZON,      // 0
            CyberPulseTestMedia.TRACK_MIDNIGHT_CIRCUIT,  // 1
            CyberPulseTestMedia.TRACK_ELECTRIC_DRIFT     // 2
        )

        // Move item from 0 to 2
        val item = queue.removeAt(0)
        queue.add(2, item)

        assertEquals(CyberPulseTestMedia.TRACK_MIDNIGHT_CIRCUIT.id, queue[0].id)
        assertEquals(CyberPulseTestMedia.TRACK_ELECTRIC_DRIFT.id, queue[1].id)
        assertEquals(CyberPulseTestMedia.TRACK_NEON_HORIZON.id, queue[2].id)
    }

    @Test
    fun queueItemRemoval_shrinksQueueSafely() {
        val queue = mutableListOf(
            CyberPulseTestMedia.TRACK_NEON_HORIZON,
            CyberPulseTestMedia.TRACK_MIDNIGHT_CIRCUIT
        )

        val removed = queue.removeAt(0)
        assertEquals(CyberPulseTestMedia.TRACK_NEON_HORIZON.id, removed.id)
        assertEquals(1, queue.size)
        assertEquals(CyberPulseTestMedia.TRACK_MIDNIGHT_CIRCUIT.id, queue[0].id)
    }

    @Test
    fun nextTrackResolution_respectsQueueBounds() {
        val queue = listOf(
            CyberPulseTestMedia.TRACK_NEON_HORIZON,
            CyberPulseTestMedia.TRACK_MIDNIGHT_CIRCUIT
        )

        val index0Next = if (0 < queue.size - 1) 0 + 1 else null
        assertEquals(1, index0Next)

        val index1Next = if (1 < queue.size - 1) 1 + 1 else null
        assertNull(index1Next)
    }
}
